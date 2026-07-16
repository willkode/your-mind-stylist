Deno.serve(async (req) => {
  const robotsTxt = `User-agent: *
Allow: /

# Public marketing pages
Allow: /About
Allow: /Programs
Allow: /Consultations
Allow: /LENS
Allow: /LearnHypnosis
Allow: /CleaningOutYourCloset
Allow: /PocketMindset
Allow: /SpeakingTraining
Allow: /FreeMasterclass
Allow: /Contact
Allow: /Blog
Allow: /BlogPost
Allow: /Books
Allow: /books/
Allow: /Bookings
Allow: /Shop
Allow: /Certification
Allow: /Podcast
Allow: /ProductPage
Allow: /WebinarPage
Allow: /LeadMagnetPage
Allow: /LegalPage
Allow: /Accessibility

# Disallow private/admin/manager/client/studio routes
Disallow: /AdminDashboard
Disallow: /AdminProducts
Disallow: /AdminRoadmap
Disallow: /AdminUsers
Disallow: /AdminUsageTracking
Disallow: /Manager*
Disallow: /Studio*
Disallow: /Dashboard
Disallow: /ClientPortal
Disallow: /ClientBookings
Disallow: /ClientsHub
Disallow: /Library
Disallow: /Resources
Disallow: /CoursePage
Disallow: /CoursePreview
Disallow: /CourseBuilder
Disallow: /CourseManager
Disallow: /ProfileSettings
Disallow: /PurchaseCenter
Disallow: /PurchaseComplete
Disallow: /PurchaseSuccess
Disallow: /BookingSuccess
Disallow: /BookingPaymentCancelled
Disallow: /BookingPaymentFailed
Disallow: /Billing
Disallow: /CalendarSettings
Disallow: /ContentStudio
Disallow: /ConsultationFormEditor
Disallow: /ConsultationSubmitted
Disallow: /KajabiImport
Disallow: /IntegrationSetup
Disallow: /StaffManagement
Disallow: /ZoomSetup
Disallow: /ZoomConnect
Disallow: /ZoomCallback
Disallow: /DemoSetup
Disallow: /TransformationDemo
Disallow: /TransformationStory
Disallow: /DepthDashboard
Disallow: /StyleJournal
Disallow: /MyIdentities
Disallow: /StylePauses
Disallow: /Evolution
Disallow: /Diary
Disallow: /Welcome
Disallow: /AffiliatePortal
Disallow: /BookAppointment
Disallow: /Masterclass
Disallow: /GuestAuthorInvite
Disallow: /BlogEditor
Disallow: /BlogManager
Disallow: /AuthorProfile
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /Cart
Disallow: /ManageSubscription
Disallow: /EmailVerified
Disallow: /ApplicationForm
Disallow: /audiobook/
Disallow: /quiz/
Disallow: /Sitemap
Disallow: /RobotsText
Disallow: /PublicPagesList
Disallow: /Maintenance
Disallow: /NotFound
Disallow: /Error401
Disallow: /Error403
Disallow: /Error500
Disallow: /BuyPrograms
Disallow: /CertPurchase
Disallow: /PocketVisualizationPurchase
Disallow: /PrivateSessionsPurchase
Disallow: /SignatureServices
Disallow: /TransitionGuide
Disallow: /ProgramsCourses
Disallow: /ProgramsWebinars
Disallow: /ProgramsOther
Disallow: /ConsultationQuestionnaire
Disallow: /book/

# Allow sitemap function endpoint
Allow: /functions/sitemapXml

# Canonical sitemap
Sitemap: https://yourmindstylist.com/sitemap.xml

# Crawl-delay
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});