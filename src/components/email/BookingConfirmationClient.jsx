import React from "react";

export default function BookingConfirmationClient({ booking }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", backgroundColor: "#F9F5EF" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1E3A32", padding: "40px 20px", textAlign: "center" }}>
        <h1 style={{ color: "#F9F5EF", fontFamily: "Georgia, serif", fontSize: "32px", margin: "0 0 10px 0" }}>
          Your Booking is Confirmed
        </h1>
        <p style={{ color: "#D8B46B", fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
          Roberta Fernandez • Your Mind Stylist
        </p>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "40px 30px" }}>
        <p style={{ color: "#2B2725", fontSize: "16px", lineHeight: "1.6", marginTop: 0 }}>
          Hi {booking.user_name},
        </p>

        <p style={{ color: "#2B2725", fontSize: "16px", lineHeight: "1.6" }}>
          Thank you for booking your session! Your payment has been confirmed and your appointment is scheduled.
        </p>

        {/* Session Date/Time - Prominent */}
        {booking.scheduled_date && (
          <div style={{ backgroundColor: "#1E3A32", padding: "30px", marginTop: "30px", marginBottom: "20px", textAlign: "center" }}>
            <p style={{ color: "#D8B46B", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
              Your Session
            </p>
            <p style={{ color: "#F9F5EF", fontFamily: "Georgia, serif", fontSize: "24px", margin: 0, lineHeight: "1.4" }}>
              {formatDate(booking.scheduled_date)}
            </p>
          </div>
        )}

        {/* Booking Details Box */}
        <div style={{ backgroundColor: "#F9F5EF", border: "2px solid #D8B46B", padding: "25px", marginTop: "30px", marginBottom: "30px" }}>
          <h2 style={{ color: "#1E3A32", fontFamily: "Georgia, serif", fontSize: "20px", marginTop: 0, marginBottom: "20px" }}>
            Booking Details
          </h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", color: "#2B2725", fontSize: "14px", opacity: 0.7 }}>Service:</td>
                <td style={{ padding: "8px 0", color: "#1E3A32", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>
                  {booking.service_type?.replace(/_/g, " ").toUpperCase()}
                </td>
              </tr>
              {booking.session_count && (
                <tr>
                  <td style={{ padding: "8px 0", color: "#2B2725", fontSize: "14px", opacity: 0.7 }}>Number of Sessions:</td>
                  <td style={{ padding: "8px 0", color: "#1E3A32", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>
                    {booking.session_count}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "8px 0", color: "#2B2725", fontSize: "14px", opacity: 0.7 }}>Amount Paid:</td>
                <td style={{ padding: "8px 0", color: "#1E3A32", fontSize: "16px", fontWeight: "700", textAlign: "right" }}>
                  {formatAmount(booking.amount)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#2B2725", fontSize: "14px", opacity: 0.7 }}>Booking Date:</td>
                <td style={{ padding: "8px 0", color: "#1E3A32", fontSize: "14px", fontWeight: "600", textAlign: "right" }}>
                  {formatDate(booking.created_date)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#2B2725", fontSize: "14px", opacity: 0.7 }}>Status:</td>
                <td style={{ padding: "8px 0", textAlign: "right" }}>
                  <span style={{ backgroundColor: "#A6B7A3", color: "#FFFFFF", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                    CONFIRMED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Next Steps */}
        <h3 style={{ color: "#1E3A32", fontFamily: "Georgia, serif", fontSize: "18px", marginTop: "30px", marginBottom: "15px" }}>
          What Happens Next
        </h3>

        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "15px" }}>
            <div style={{ backgroundColor: "#D8B46B", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: "12px", flexShrink: 0, fontSize: "14px", fontWeight: "600" }}>
              1
            </div>
            <p style={{ color: "#2B2725", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              <strong>Confirmation:</strong> You'll receive reminder emails 24 hours and 1 hour before your session.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "15px" }}>
            <div style={{ backgroundColor: "#D8B46B", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: "12px", flexShrink: 0, fontSize: "14px", fontWeight: "600" }}>
              2
            </div>
            <p style={{ color: "#2B2725", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              <strong>Preparation:</strong> Before your session, take some time to reflect on what you'd like to work on and what patterns you'd like to shift.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ backgroundColor: "#D8B46B", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: "12px", flexShrink: 0, fontSize: "14px", fontWeight: "600" }}>
              3
            </div>
            <p style={{ color: "#2B2725", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              <strong>Your Journey Begins:</strong> Show up ready to explore, shift, and design the mental patterns that will serve you moving forward.
            </p>
          </div>
        </div>

        {/* Zoom Meeting Link */}
        {booking.zoom_status === 'created' && booking.zoom_join_url && (
          <div style={{ backgroundColor: "#E8F4FD", border: "2px solid #2D8CFF", padding: "25px", marginTop: "30px", marginBottom: "20px" }}>
            <h3 style={{ color: "#1E3A32", fontFamily: "Georgia, serif", fontSize: "18px", marginTop: 0, marginBottom: "15px", display: "flex", alignItems: "center" }}>
              🎥 Your Zoom Meeting Link
            </h3>
            <p style={{ color: "#2B2725", fontSize: "14px", lineHeight: "1.6", marginBottom: "15px" }}>
              Your virtual session is all set up. Click the button below to join when it's time for your session.
            </p>
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <a 
                href={booking.zoom_join_url}
                style={{ 
                  display: "inline-block",
                  backgroundColor: "#2D8CFF", 
                  color: "#FFFFFF", 
                  padding: "14px 32px", 
                  textDecoration: "none", 
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "4px"
                }}
              >
                Join Zoom Meeting
              </a>
            </div>
            {booking.zoom_password && (
              <p style={{ color: "#2B2725", fontSize: "13px", textAlign: "center", margin: 0 }}>
                Meeting Password: <strong style={{ fontFamily: "monospace" }}>{booking.zoom_password}</strong>
              </p>
            )}
          </div>
        )}

        {booking.notes && (
          <div style={{ backgroundColor: "#F9F5EF", padding: "20px", marginTop: "30px", borderLeft: "4px solid #D8B46B" }}>
            <p style={{ color: "#2B2725", fontSize: "14px", margin: "0 0 8px 0", fontWeight: "600" }}>Your Notes:</p>
            <p style={{ color: "#2B2725", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {booking.notes}
            </p>
          </div>
        )}

        <p style={{ color: "#2B2725", fontSize: "16px", lineHeight: "1.6", marginTop: "30px", marginBottom: "10px" }}>
          I'm excited to begin this work with you.
        </p>

        <p style={{ color: "#2B2725", fontSize: "16px", lineHeight: "1.6", margin: 0 }}>
          Roberta Fernandez<br />
          <span style={{ color: "#D8B46B", fontSize: "14px" }}>Your Mind Stylist</span>
        </p>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: "#F9F5EF", padding: "30px 20px", textAlign: "center", borderTop: "1px solid #E4D9C4" }}>
        <p style={{ color: "#2B2725", fontSize: "12px", opacity: 0.6, margin: "0 0 10px 0" }}>
          Questions? Reply to this email or visit yourmindstylist.com/contact
        </p>
        <p style={{ color: "#2B2725", fontSize: "12px", opacity: 0.6, margin: 0 }}>
          © {new Date().getFullYear()} Your Mind Stylist. All rights reserved.
        </p>
      </div>
    </div>
  );
}