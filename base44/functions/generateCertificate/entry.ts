import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { course_id } = await req.json();

        if (!course_id) {
            return Response.json({ error: 'Missing course_id' }, { status: 400 });
        }

        // Get course and progress
        const courses = await base44.entities.Course.filter({ id: course_id });
        if (courses.length === 0) {
            return Response.json({ error: 'Course not found' }, { status: 404 });
        }
        const course = courses[0];

        const progressRecords = await base44.entities.UserCourseProgress.filter({
            user_id: user.id,
            course_id: course_id
        });

        if (progressRecords.length === 0 || progressRecords[0].status !== 'completed') {
            return Response.json({ error: 'Course not completed' }, { status: 400 });
        }

        const progress = progressRecords[0];

        // Generate PDF certificate
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor(249, 245, 239); // Cream
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Border
        doc.setDrawColor(216, 180, 107); // Gold
        doc.setLineWidth(2);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Inner border
        doc.setLineWidth(0.5);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

        // Title
        doc.setFontSize(40);
        doc.setTextColor(30, 58, 50); // Forest green
        doc.text('Certificate of Completion', pageWidth / 2, 40, { align: 'center' });

        // Subtitle line
        doc.setLineWidth(0.5);
        doc.setDrawColor(216, 180, 107);
        doc.line(pageWidth / 2 - 60, 48, pageWidth / 2 + 60, 48);

        // Body text
        doc.setFontSize(14);
        doc.setTextColor(43, 39, 37); // Charcoal
        doc.text('This certifies that', pageWidth / 2, 65, { align: 'center' });

        // Name
        doc.setFontSize(32);
        doc.setTextColor(30, 58, 50);
        doc.text(user.full_name, pageWidth / 2, 85, { align: 'center' });

        // Has completed
        doc.setFontSize(14);
        doc.setTextColor(43, 39, 37);
        doc.text('has successfully completed', pageWidth / 2, 100, { align: 'center' });

        // Course name
        doc.setFontSize(24);
        doc.setTextColor(30, 58, 50);
        const courseNameLines = doc.splitTextToSize(course.title, pageWidth - 80);
        const courseNameY = 115;
        courseNameLines.forEach((line, index) => {
            doc.text(line, pageWidth / 2, courseNameY + (index * 10), { align: 'center' });
        });

        // Date
        const completionDate = new Date(progress.completed_date);
        const dateStr = completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        doc.setFontSize(12);
        doc.setTextColor(43, 39, 37);
        doc.text(`Completed on ${dateStr}`, pageWidth / 2, 145, { align: 'center' });

        // Signature section
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 40, 170, pageWidth / 2 + 40, 170);
        
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 50);
        doc.text('Roberta Fernandez', pageWidth / 2, 178, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(216, 180, 107);
        doc.text('Your Mind Stylist', pageWidth / 2, 184, { align: 'center' });

        // Certificate ID (bottom right)
        const certificateId = `CERT-${user.id.slice(0, 8)}-${course_id.slice(0, 8)}`;
        doc.setFontSize(8);
        doc.setTextColor(43, 39, 37, 100);
        doc.text(`Certificate ID: ${certificateId}`, pageWidth - 20, pageHeight - 15, { align: 'right' });

        // Convert to blob
        const pdfBlob = doc.output('arraybuffer');

        // Upload to storage
        const fileName = `certificates/${user.id}/${course_id}-${Date.now()}.pdf`;
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
            file: new Uint8Array(pdfBlob)
        });

        // Update progress record with certificate URL
        await base44.asServiceRole.entities.UserCourseProgress.update(progress.id, {
            certificate_url: uploadResult.file_url,
            certificate_generated_date: new Date().toISOString()
        });

        return Response.json({
            success: true,
            certificate_url: uploadResult.file_url,
            certificate_id: certificateId
        });

    } catch (error) {
        console.error('Certificate generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});