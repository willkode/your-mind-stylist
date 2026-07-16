/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Accessibility from './pages/Accessibility';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminRoadmap from './pages/AdminRoadmap';
import AdminUsers from './pages/AdminUsers';
import AffiliatePortal from './pages/AffiliatePortal';
import ApplicationForm from './pages/ApplicationForm';
import AuthorProfile from './pages/AuthorProfile';
import Billing from './pages/Billing';
import Blog from './pages/Blog';
import BlogEditor from './pages/BlogEditor';
import BlogManager from './pages/BlogManager';
import BlogPost from './pages/BlogPost';
import BookAppointment from './pages/BookAppointment';
import BookingPaymentCancelled from './pages/BookingPaymentCancelled';
import BookingPaymentFailed from './pages/BookingPaymentFailed';
import BookingSuccess from './pages/BookingSuccess';
import Bookings from './pages/Bookings';
import BuyPrograms from './pages/BuyPrograms';
import CalendarSettings from './pages/CalendarSettings';
import Cart from './pages/Cart';
import CertPurchase from './pages/CertPurchase';
import Certification from './pages/Certification';
import CleaningOutYourCloset from './pages/CleaningOutYourCloset';
import ClientBookings from './pages/ClientBookings';
import ClientPortal from './pages/ClientPortal';
import ConsultationFormEditor from './pages/ConsultationFormEditor';
import ConsultationQuestionnaire from './pages/ConsultationQuestionnaire';
import ConsultationSubmitted from './pages/ConsultationSubmitted';
import Consultations from './pages/Consultations';
import Contact from './pages/Contact';
import ContentStudio from './pages/ContentStudio';
import CourseBuilder from './pages/CourseBuilder';
import CourseManager from './pages/CourseManager';
import CoursePage from './pages/CoursePage';
import CoursePreview from './pages/CoursePreview';
import Dashboard from './pages/Dashboard';
import DemoSetup from './pages/DemoSetup';
import DepthDashboard from './pages/DepthDashboard';
import Diary from './pages/Diary';
import EmailVerified from './pages/EmailVerified';
import Error401 from './pages/Error401';
import Error403 from './pages/Error403';
import Error500 from './pages/Error500';
import Evolution from './pages/Evolution';
import FreeMasterclass from './pages/FreeMasterclass';
import GuestAuthorInvite from './pages/GuestAuthorInvite';
import Home from './pages/Home';
import IntegrationSetup from './pages/IntegrationSetup';
import KajabiImport from './pages/KajabiImport';
import LENS from './pages/LENS';
import LeadMagnetPage from './pages/LeadMagnetPage';
import LearnHypnosis from './pages/LearnHypnosis';
import LegalPage from './pages/LegalPage';
import Library from './pages/Library';
import Maintenance from './pages/Maintenance';
import ManageSubscription from './pages/ManageSubscription';
import ManagerAffiliates from './pages/ManagerAffiliates';
import ManagerAnalytics from './pages/ManagerAnalytics';
import ManagerApplications from './pages/ManagerApplications';
import ManagerAppointmentTypes from './pages/ManagerAppointmentTypes';
import ManagerAppointments from './pages/ManagerAppointments';
import ManagerAudioSessions from './pages/ManagerAudioSessions';
import ManagerAvailability from './pages/ManagerAvailability';
import ManagerBookings from './pages/ManagerBookings';
import ManagerCRM from './pages/ManagerCRM';
import ManagerCalendar from './pages/ManagerCalendar';
import ManagerClientAnalytics from './pages/ManagerClientAnalytics';
import ManagerCourseAnalytics from './pages/ManagerCourseAnalytics';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerEmailSequences from './pages/ManagerEmailSequences';
import ManagerEmailTemplates from './pages/ManagerEmailTemplates';
import ManagerIntakeReview from './pages/ManagerIntakeReview';
import ManagerLeadImport from './pages/ManagerLeadImport';
import ManagerLeadMagnets from './pages/ManagerLeadMagnets';
import ManagerMailerLite from './pages/ManagerMailerLite';
import ManagerMasterclass from './pages/ManagerMasterclass';
import ManagerPaymentPlans from './pages/ManagerPaymentPlans';
import ManagerProductAnalytics from './pages/ManagerProductAnalytics';
import ManagerProducts from './pages/ManagerProducts';
import ManagerPurchaseFunnel from './pages/ManagerPurchaseFunnel';
import ManagerQuizAnalytics from './pages/ManagerQuizAnalytics';
import ManagerReports from './pages/ManagerReports';
import ManagerResourceEditor from './pages/ManagerResourceEditor';
import ManagerResources from './pages/ManagerResources';
import ManagerSettings from './pages/ManagerSettings';
import ManagerSubscriptionAnalytics from './pages/ManagerSubscriptionAnalytics';
import ManagerSubscriptions from './pages/ManagerSubscriptions';
import ManagerTransformationAnalytics from './pages/ManagerTransformationAnalytics';
import ManagerVoiceProfiles from './pages/ManagerVoiceProfiles';
import ManagerWaitingList from './pages/ManagerWaitingList';
import ManagerWebinarEditor from './pages/ManagerWebinarEditor';
import Masterclass from './pages/Masterclass';
import NotFound from './pages/NotFound';
import PocketMindset from './pages/PocketMindset';
import PocketVisualizationPurchase from './pages/PocketVisualizationPurchase';
import Podcast from './pages/Podcast';
import PrivateSessionsPurchase from './pages/PrivateSessionsPurchase';
import ProductPage from './pages/ProductPage';
import ProfileSettings from './pages/ProfileSettings';
import Programs from './pages/Programs';
import ProgramsBooks from './pages/ProgramsBooks';
import ProgramsCourses from './pages/ProgramsCourses';
import ProgramsOther from './pages/ProgramsOther';
import ProgramsWebinars from './pages/ProgramsWebinars';
import PublicPagesList from './pages/PublicPagesList';
import PurchaseCenter from './pages/PurchaseCenter';
import PurchaseComplete from './pages/PurchaseComplete';
import PurchaseSuccess from './pages/PurchaseSuccess';
import Resources from './pages/Resources';
import RobotsText from './pages/RobotsText';
import Shop from './pages/Shop';
import SignatureServices from './pages/SignatureServices';
import Sitemap from './pages/Sitemap';
import SpeakingTraining from './pages/SpeakingTraining';
import StaffManagement from './pages/StaffManagement';
import StudioAudio from './pages/StudioAudio';
import StudioDashboard from './pages/StudioDashboard';
import StudioDevDocs from './pages/StudioDevDocs';
import StudioLegal from './pages/StudioLegal';
import StudioLegalEditor from './pages/StudioLegalEditor';
import StudioLogs from './pages/StudioLogs';
import StudioNotes from './pages/StudioNotes';
import StudioPricing from './pages/StudioPricing';
import StudioRevisions from './pages/StudioRevisions';
import StudioRoles from './pages/StudioRoles';
import StudioSettings from './pages/StudioSettings';
import StylePauses from './pages/StylePauses';
import TransformationDemo from './pages/TransformationDemo';
import TransformationStory from './pages/TransformationStory';
import TransitionGuide from './pages/TransitionGuide';
import WebinarPage from './pages/WebinarPage';
import Welcome from './pages/Welcome';
import ZoomCallback from './pages/ZoomCallback';
import ZoomConnect from './pages/ZoomConnect';
import ZoomSetup from './pages/ZoomSetup';
import ClientsHub from './pages/ClientsHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Accessibility": Accessibility,
    "AdminDashboard": AdminDashboard,
    "AdminProducts": AdminProducts,
    "AdminRoadmap": AdminRoadmap,
    "AdminUsers": AdminUsers,
    "AffiliatePortal": AffiliatePortal,
    "ApplicationForm": ApplicationForm,
    "AuthorProfile": AuthorProfile,
    "Billing": Billing,
    "Blog": Blog,
    "BlogEditor": BlogEditor,
    "BlogManager": BlogManager,
    "BlogPost": BlogPost,
    "BookAppointment": BookAppointment,
    "BookingPaymentCancelled": BookingPaymentCancelled,
    "BookingPaymentFailed": BookingPaymentFailed,
    "BookingSuccess": BookingSuccess,
    "Bookings": Bookings,
    "BuyPrograms": BuyPrograms,
    "CalendarSettings": CalendarSettings,
    "Cart": Cart,
    "CertPurchase": CertPurchase,
    "Certification": Certification,
    "CleaningOutYourCloset": CleaningOutYourCloset,
    "ClientBookings": ClientBookings,
    "ClientPortal": ClientPortal,
    "ConsultationFormEditor": ConsultationFormEditor,
    "ConsultationQuestionnaire": ConsultationQuestionnaire,
    "ConsultationSubmitted": ConsultationSubmitted,
    "Consultations": Consultations,
    "Contact": Contact,
    "ContentStudio": ContentStudio,
    "CourseBuilder": CourseBuilder,
    "CourseManager": CourseManager,
    "CoursePage": CoursePage,
    "CoursePreview": CoursePreview,
    "Dashboard": Dashboard,
    "DemoSetup": DemoSetup,
    "DepthDashboard": DepthDashboard,
    "Diary": Diary,
    "EmailVerified": EmailVerified,
    "Error401": Error401,
    "Error403": Error403,
    "Error500": Error500,
    "Evolution": Evolution,
    "FreeMasterclass": FreeMasterclass,
    "GuestAuthorInvite": GuestAuthorInvite,
    "Home": Home,
    "IntegrationSetup": IntegrationSetup,
    "KajabiImport": KajabiImport,
    "LENS": LENS,
    "LeadMagnetPage": LeadMagnetPage,
    "LearnHypnosis": LearnHypnosis,
    "LegalPage": LegalPage,
    "Library": Library,
    "Maintenance": Maintenance,
    "ManageSubscription": ManageSubscription,
    "ManagerAffiliates": ManagerAffiliates,
    "ManagerAnalytics": ManagerAnalytics,
    "ManagerApplications": ManagerApplications,
    "ManagerAppointmentTypes": ManagerAppointmentTypes,
    "ManagerAppointments": ManagerAppointments,
    "ManagerAudioSessions": ManagerAudioSessions,
    "ManagerAvailability": ManagerAvailability,
    "ManagerBookings": ManagerBookings,
    "ManagerCRM": ManagerCRM,
    "ManagerCalendar": ManagerCalendar,
    "ManagerClientAnalytics": ManagerClientAnalytics,
    "ManagerCourseAnalytics": ManagerCourseAnalytics,
    "ManagerDashboard": ManagerDashboard,
    "ManagerEmailSequences": ManagerEmailSequences,
    "ManagerEmailTemplates": ManagerEmailTemplates,
    "ManagerIntakeReview": ManagerIntakeReview,
    "ManagerLeadImport": ManagerLeadImport,
    "ManagerLeadMagnets": ManagerLeadMagnets,
    "ManagerMailerLite": ManagerMailerLite,
    "ManagerMasterclass": ManagerMasterclass,
    "ManagerPaymentPlans": ManagerPaymentPlans,
    "ManagerProductAnalytics": ManagerProductAnalytics,
    "ManagerProducts": ManagerProducts,
    "ManagerPurchaseFunnel": ManagerPurchaseFunnel,
    "ManagerQuizAnalytics": ManagerQuizAnalytics,
    "ManagerReports": ManagerReports,
    "ManagerResourceEditor": ManagerResourceEditor,
    "ManagerResources": ManagerResources,
    "ManagerSettings": ManagerSettings,
    "ManagerSubscriptionAnalytics": ManagerSubscriptionAnalytics,
    "ManagerSubscriptions": ManagerSubscriptions,
    "ManagerTransformationAnalytics": ManagerTransformationAnalytics,
    "ManagerVoiceProfiles": ManagerVoiceProfiles,
    "ManagerWaitingList": ManagerWaitingList,
    "ManagerWebinarEditor": ManagerWebinarEditor,
    "Masterclass": Masterclass,
    "NotFound": NotFound,
    "PocketMindset": PocketMindset,
    "PocketVisualizationPurchase": PocketVisualizationPurchase,
    "Podcast": Podcast,
    "PrivateSessionsPurchase": PrivateSessionsPurchase,
    "ProductPage": ProductPage,
    "ProfileSettings": ProfileSettings,
    "Programs": Programs,
    "ProgramsBooks": ProgramsBooks,
    "ProgramsCourses": ProgramsCourses,
    "ProgramsOther": ProgramsOther,
    "ProgramsWebinars": ProgramsWebinars,
    "PublicPagesList": PublicPagesList,
    "PurchaseCenter": PurchaseCenter,
    "PurchaseComplete": PurchaseComplete,
    "PurchaseSuccess": PurchaseSuccess,
    "Resources": Resources,
    "RobotsText": RobotsText,
    "Shop": Shop,
    "SignatureServices": SignatureServices,
    "Sitemap": Sitemap,
    "SpeakingTraining": SpeakingTraining,
    "StaffManagement": StaffManagement,
    "StudioAudio": StudioAudio,
    "StudioDashboard": StudioDashboard,
    "StudioDevDocs": StudioDevDocs,
    "StudioLegal": StudioLegal,
    "StudioLegalEditor": StudioLegalEditor,
    "StudioLogs": StudioLogs,
    "StudioNotes": StudioNotes,
    "StudioPricing": StudioPricing,
    "StudioRevisions": StudioRevisions,
    "StudioRoles": StudioRoles,
    "StudioSettings": StudioSettings,
    "StylePauses": StylePauses,
    "TransformationDemo": TransformationDemo,
    "TransformationStory": TransformationStory,
    "TransitionGuide": TransitionGuide,
    "WebinarPage": WebinarPage,
    "Welcome": Welcome,
    "ZoomCallback": ZoomCallback,
    "ZoomConnect": ZoomConnect,
    "ZoomSetup": ZoomSetup,
    "ClientsHub": ClientsHub,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};