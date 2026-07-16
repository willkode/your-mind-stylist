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

    // Get course progress
    const progressRecords = await base44.entities.UserCourseProgress.filter({
      user_id: user.id,
      course_id,
      status: 'completed'
    });

    if (!progressRecords || progressRecords.length === 0) {
      return Response.json({ error: 'Course not completed' }, { status: 400 });
    }

    const progress = progressRecords[0];

    // Get course details
    const courses = await base44.entities.Course.filter({ id: course_id });
    if (!courses || courses.length === 0) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courses[0];

    if (!course.certificate_enabled) {
      return Response.json({ error: 'Certificates not enabled for this course' }, { status: 400 });
    }

    // Generate certificate ID if not exists
    const certificateId = progress.certificate_id || `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Certificate background and border
    doc.setFillColor(249, 245, 239); // #F9F5EF
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setDrawColor(216, 180, 107); // #D8B46B
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(30, 58, 50); // #1E3A32
    doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 40, { align: 'center' });

    // Decorative line
    doc.setDrawColor(216, 180, 107);
    doc.setLineWidth(1);
    doc.line(60, 50, pageWidth - 60, 50);

    // Body text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(43, 39, 37); // #2B2725
    doc.text('This is to certify that', pageWidth / 2, 70, { align: 'center' });

    // User name (larger and bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(30, 58, 50);
    doc.text(user.full_name, pageWidth / 2, 90, { align: 'center' });

    // Course details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(43, 39, 37);
    doc.text('has successfully completed', pageWidth / 2, 105, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 50);
    doc.text(course.title, pageWidth / 2, 120, { align: 'center' });

    // Completion date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(43, 39, 37);
    const completionDate = new Date(progress.completed_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Completed on ${completionDate}`, pageWidth / 2, 135, { align: 'center' });

    // Certificate ID
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, 145, { align: 'center' });

    // Instructor signature area
    if (course.instructor_name) {
      const sigY = 170;
      doc.setDrawColor(43, 39, 37);
      doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 50);
      doc.text(course.instructor_name, pageWidth / 2, sigY + 7, { align: 'center' });
      
      if (course.instructor_title) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(course.instructor_title, pageWidth / 2, sigY + 13, { align: 'center' });
      }
    }

    // Generate PDF as buffer
    const pdfBytes = doc.output('arraybuffer');
    
    // Upload to storage
    const fileName = `certificates/${user.id}/${course_id}-${certificateId}.pdf`;
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({
      file: new Uint8Array(pdfBytes)
    });

    // Update progress with certificate info
    await base44.asServiceRole.entities.UserCourseProgress.update(progress.id, {
      certificate_issued: true,
      certificate_url: uploadResult.file_uri,
      certificate_id: certificateId
    });

    // Create signed URL for download
    const signedUrl = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: uploadResult.file_uri,
      expires_in: 3600 // 1 hour
    });

    return Response.json({
      success: true,
      certificate_id: certificateId,
      download_url: signedUrl.signed_url
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});