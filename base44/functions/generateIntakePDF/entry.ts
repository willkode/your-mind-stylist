import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { intake_id } = await req.json();
    const intakes = await base44.asServiceRole.entities.ConsultationIntake.filter({ id: intake_id });

    if (!intakes || intakes.length === 0) {
      return Response.json({ error: 'Intake not found' }, { status: 404 });
    }

    const data = intakes[0];

    // Fetch all form field definitions to build the PDF dynamically
    const formFields = await base44.asServiceRole.entities.ConsultationForm.list(undefined, 200);
    const processedFields = formFields.map(f => f.data || f).filter(f => f && f.field_name);

    const doc = new jsPDF();
    let y = 20;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkY = (needed = 10) => { if (y + needed > 275) addPage(); };

    const addText = (text, size = 10, bold = false) => {
      checkY(size + 4);
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || ''), 170);
      doc.text(lines, 20, y);
      y += lines.length * (size * 0.45 + 2);
    };

    const addField = (label, value) => {
      checkY(14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const labelLines = doc.splitTextToSize(`${label}:`, 170);
      doc.text(labelLines, 20, y);
      y += labelLines.length * 6;

      doc.setFont('helvetica', 'normal');
      const val = Array.isArray(value) ? value.join(', ') : (value === true ? 'Yes' : value === false ? 'No' : (value || 'N/A'));
      const valLines = doc.splitTextToSize(String(val), 170);
      doc.text(valLines, 25, y);
      y += valLines.length * 5 + 3;
    };

    const addSection = (title) => {
      checkY(20);
      y += 6;
      doc.setDrawColor(216, 180, 107);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 6;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    };

    // Title
    addText('Initial Consultation Questionnaire', 18, true);
    y += 2;
    addText(`Submitted: ${new Date(data.submitted_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 10);
    y += 5;

    // Group form fields by step
    const steps = {};
    for (const field of processedFields) {
      const stepNum = parseInt(field.step, 10);
      if (!steps[stepNum]) steps[stepNum] = { title: field.step_title || `Step ${stepNum}`, fields: [] };
      if (field.step_title && !steps[stepNum].titleSet) {
        steps[stepNum].title = field.step_title;
        steps[stepNum].titleSet = true;
      }
      steps[stepNum].fields.push(field);
    }

    const sortedStepNums = Object.keys(steps).map(Number).sort((a, b) => a - b);

    for (const stepNum of sortedStepNums) {
      const stepData = steps[stepNum];
      addSection(stepData.title);

      const sortedFields = stepData.fields.sort((a, b) => (a.order || 0) - (b.order || 0));

      for (const field of sortedFields) {
        if (field.conditional_field) {
          const condValue = data[field.conditional_field];
          if (Array.isArray(condValue)) {
            if (!condValue.includes(field.conditional_value)) continue;
          } else if (String(condValue) !== String(field.conditional_value)) {
            continue;
          }
        }

        const value = data[field.field_name];
        if (value === undefined || value === null || value === '') {
          if (!field.required) continue;
        }

        addField(field.label, value);
      }
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=intake_${(data.name || 'client').replace(/\s+/g, '_')}_${Date.now()}.pdf`
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});