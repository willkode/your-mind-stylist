import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate request
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signup_id, sequence_number = 1 } = await req.json();

    if (!signup_id) {
      return Response.json({ error: 'signup_id is required' }, { status: 400 });
    }

    // Get the signup record
    const signup = await base44.asServiceRole.entities.MasterclassSignup.list();
    const signupRecord = signup.find(s => s.id === signup_id);

    if (!signupRecord) {
      return Response.json({ error: 'Signup not found' }, { status: 404 });
    }

    const emailSequences = {
      1: {
        subject: "Welcome to Your Mind Styling Journey",
        body: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1E3A32; font-size: 28px; margin-bottom: 20px;">Welcome, ${signupRecord.full_name}</h1>
            
            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              I'm thrilled you've signed up for the masterclass. This is the beginning of something transformative.
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              You mentioned your biggest challenge is: <strong>"${signupRecord.biggest_challenge}"</strong>
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 30px;">
              I designed this masterclass specifically to address challenges like yours. Over the next hour, you'll discover:
            </p>

            <ul style="color: #2B2725; line-height: 1.8; margin-bottom: 30px;">
              <li>How to recognize and interrupt limiting patterns</li>
              <li>The Mind Styling framework I use with private clients</li>
              <li>Practical tools you can use immediately</li>
            </ul>

            <div style="text-align: center; margin: 40px 0;">
              <a href="https://yourmindstylist.com/masterclass" 
                 style="background: #1E3A32; color: white; padding: 16px 32px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Watch the Masterclass Now
              </a>
            </div>

            <p style="color: #2B2725; line-height: 1.8; margin-top: 40px;">
              Here's to your transformation,<br>
              <strong>Roberta Fernandez</strong><br>
              <span style="color: #D8B46B;">Your Mind Stylist</span>
            </p>
          </div>
        `,
        delay: 0 // Send immediately
      },
      2: {
        subject: "What Did You Think? (+ Next Steps)",
        body: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1E3A32; font-size: 28px; margin-bottom: 20px;">How Was the Masterclass?</h1>
            
            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              Hi ${signupRecord.full_name},
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              I hope you found the masterclass valuable. Many people tell me it shifts how they see their patterns—and that awareness is the first step.
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 30px;">
              If you're wondering <em>"What's next?"</em> here are your options:
            </p>

            <div style="background: #F9F5EF; padding: 20px; margin-bottom: 20px; border-left: 4px solid #D8B46B;">
              <h3 style="color: #1E3A32; margin-bottom: 10px;">1:1 Coaching</h3>
              <p style="color: #2B2725; margin-bottom: 10px;">Work directly with me to transform your specific challenge.</p>
              <a href="https://yourmindstylist.com/private-sessions" style="color: #D8B46B; text-decoration: none;">Learn More →</a>
            </div>

            <div style="background: #F9F5EF; padding: 20px; margin-bottom: 20px; border-left: 4px solid #A6B7A3;">
              <h3 style="color: #1E3A32; margin-bottom: 10px;">Pocket Visualization™</h3>
              <p style="color: #2B2725; margin-bottom: 10px;">Daily guided sessions for emotional resets throughout your day.</p>
              <a href="https://yourmindstylist.com/pocket-visualization" style="color: #A6B7A3; text-decoration: none;">Try It Free →</a>
            </div>

            <p style="color: #2B2725; line-height: 1.8; margin-top: 30px;">
              All the best,<br>
              <strong>Roberta</strong>
            </p>
          </div>
        `,
        delay: 86400000 // 24 hours
      },
      3: {
        subject: "A Question About Your Pattern",
        body: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1E3A32; font-size: 28px; margin-bottom: 20px;">I Have a Question for You</h1>
            
            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              ${signupRecord.full_name},
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              You mentioned that <strong>${signupRecord.biggest_challenge}</strong> is your biggest challenge right now.
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 30px;">
              Here's what I'm curious about: <em>What would change if that pattern disappeared tomorrow?</em>
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 20px;">
              Most people can't articulate it—but when I ask my private clients this question, they suddenly see why they've been stuck.
            </p>

            <p style="color: #2B2725; line-height: 1.8; margin-bottom: 30px;">
              If you'd like help clarifying (and shifting) that pattern, let's talk.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="https://yourmindstylist.com/contact?interest=private-sessions" 
                 style="background: #1E3A32; color: white; padding: 16px 32px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Schedule a Consultation
              </a>
            </div>

            <p style="color: #2B2725; line-height: 1.8; margin-top: 40px;">
              Warmly,<br>
              <strong>Roberta</strong>
            </p>
          </div>
        `,
        delay: 259200000 // 72 hours
      }
    };

    const email = emailSequences[sequence_number];

    if (!email) {
      return Response.json({ error: 'Invalid sequence number' }, { status: 400 });
    }

    // Send the email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "Roberta Fernandez",
      to: signupRecord.email,
      subject: email.subject,
      body: email.body
    });

    // Update the signup record to track which emails were sent
    const emailSentField = `welcome_email_${sequence_number}_sent`;
    await base44.asServiceRole.entities.MasterclassSignup.update(signup_id, {
      [emailSentField]: true
    });

    return Response.json({ 
      success: true, 
      message: `Welcome email sequence ${sequence_number} sent to ${signupRecord.email}` 
    });

  } catch (error) {
    console.error('Error sending welcome email sequence:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});