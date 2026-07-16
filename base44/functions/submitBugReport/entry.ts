import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Don't require auth - allow public bug reports
    const body = await req.json();
    
    const {
      description,
      reporter_email,
      reporter_name,
      page_url,
      screenshot_url,
      additional_screenshots,
      browser_info
    } = body;

    if (!description || !reporter_email || !page_url) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate AI analysis and reproduction steps
    let reproduction_steps = "";
    let ai_analysis = "";
    let title = "";
    let priority = "Medium";

    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this bug report and provide:
1. A concise title (max 10 words)
2. Step-by-step reproduction instructions
3. Root cause analysis and potential solutions
4. Suggested priority (Low/Medium/High/Critical)

Bug Report:
Description: ${description}
Page: ${page_url}
Browser: ${browser_info}

Provide your response in the following JSON format:
{
  "title": "...",
  "reproduction_steps": ["step 1", "step 2", ...],
  "ai_analysis": "...",
  "priority": "Medium"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            reproduction_steps: {
              type: "array",
              items: { type: "string" }
            },
            ai_analysis: { type: "string" },
            priority: {
              type: "string",
              enum: ["Low", "Medium", "High", "Critical"]
            }
          }
        }
      });

      title = aiResponse.title || "Bug Report";
      reproduction_steps = aiResponse.reproduction_steps?.join('\n') || "";
      ai_analysis = aiResponse.ai_analysis || "";
      priority = aiResponse.priority || "Medium";
    } catch (error) {
      console.error("AI analysis failed:", error);
      title = description.substring(0, 100);
      ai_analysis = "AI analysis unavailable";
    }

    // Create bug report in database
    let bugReport;
    try {
      bugReport = await base44.asServiceRole.entities.BugReport.create({
        title,
        description,
        status: "New",
        priority,
        reporter_email,
        reporter_name,
        page_url,
        screenshot_url,
        additional_screenshots: additional_screenshots || [],
        browser_info,
        reproduction_steps,
        ai_analysis
      });
    } catch (dbError) {
      console.error("Failed to create bug report in database:", dbError);
      return Response.json(
        { error: "Failed to save bug report: " + dbError.message },
        { status: 500 }
      );
    }

    // Send notification email to admin
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: "roberta@yourmindstylist.com",
        subject: `🐛 New Bug Report: ${title}`,
        body: `
A new bug has been reported:

Title: ${title}
Priority: ${priority}
Reporter: ${reporter_name} (${reporter_email})
Page: ${page_url}

Description:
${description}

AI Analysis:
${ai_analysis}

View details: https://yourmindstylist.com/AdminRoadmap
        `
      });
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    return Response.json({
      success: true,
      bug_report_id: bugReport.id
    });

  } catch (error) {
    console.error("Error submitting bug report:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});