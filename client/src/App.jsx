import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import KitchenDisplay from './pages/KitchenDisplay';
import POS from './pages/POS';

import DashboardLayout from './layouts/DashboardLayout';
import RealtimeOrders from './components/RealtimeOrders';
import MenuManagement from './pages/MenuManagement';
import CategoryDetail from './pages/CategoryDetail';
import ProductDetail from './pages/ProductDetail';
import Overview from './pages/Overview';
import Accounts from './pages/Accounts';
import OrderHistory from './pages/OrderHistory';
import SoldProducts from './pages/SoldProducts';
import PosProductTypes from './pages/PosProductTypes';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Warehouses from './pages/Warehouses';
import NewWarehouse from './pages/NewWarehouse';
import StockUnits from './pages/StockUnits';
import NewStockUnit from './pages/NewStockUnit';
import StockCategories from './pages/StockCategories';
import NewStockCategory from './pages/NewStockCategory';
import StockProducts from './pages/StockProducts';
import NewStockProduct from './pages/NewStockProduct';
import StockProductDetail from './pages/StockProductDetail';
import StockEntries from './pages/StockEntries';
import StockStatus from './pages/StockStatus';
import NewStockEntry from './pages/NewStockEntry';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Subeler from './pages/Subeler';
import BulkPriceEdit from './pages/BulkPriceEdit';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import EditCampaign from './pages/EditCampaign';
import HappyHourList from './pages/HappyHourList';
import NewHappyHour from './pages/NewHappyHour';
import EditHappyHour from './pages/EditHappyHour';
import TimedDiscountsList from './pages/TimedDiscountsList';
import NewTimedDiscount from './pages/NewTimedDiscount';
import QRMenu from './pages/QRMenu';
import QRMenuDetail from './pages/QRMenuDetail';
import QRFeedback from './pages/QRFeedback';
import QRSettings from './pages/QRSettings';
import QRClickReports from './pages/QRClickReports';
import QRHome from './pages/QRHome';
import QRMenuPublic from './pages/QRMenuPublic';
import SeatingAreaDetail from './pages/SeatingAreaDetail';
import SeatingLayoutDesigner from './pages/SeatingLayoutDesigner';

import SeatingAreas from './pages/SeatingAreas';
import DeliveryAddresses from './pages/DeliveryAddresses';
import Customers from './pages/Customers';
import CustomerBusinesses from './pages/CustomerBusinesses';
import NewCustomerBusiness from './pages/NewCustomerBusiness';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import InvoiceItems from './pages/InvoiceItems';
import PersonnelPayments from './pages/PersonnelPayments';
import PersonnelPaymentDetail from './pages/PersonnelPaymentDetail';
import NewPersonnelPayment from './pages/NewPersonnelPayment';
import OptionalProducts from './pages/OptionalProducts';
import ProductOptions from './pages/ProductOptions';
import NewProductOptionGroup from './pages/NewProductOptionGroup';
import EditProductOptionGroup from './pages/EditProductOptionGroup';
import ProductOptionDetail from './pages/ProductOptionDetail';
import PaymentMethods from './pages/PaymentMethods';
import NewPaymentMethod from './pages/NewPaymentMethod';
import EditPaymentMethod from './pages/EditPaymentMethod';
import Devices from './pages/Devices';
import NewDevice from './pages/NewDevice';
import Printers from './pages/Printers';
import NewPrinter from './pages/NewPrinter';
import EditPrinter from './pages/EditPrinter';
import Terminals from './pages/Terminals';
import NewTerminal from './pages/NewTerminal';
import DiscountTypes from './pages/DiscountTypes';
import NewDiscountType from './pages/NewDiscountType';
import EditDiscountType from './pages/EditDiscountType';
import Settings from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import Targets from './pages/Targets';
import StaffNotifications from './pages/StaffNotifications';
import StaffShifts from './pages/StaffShifts';
import BulkShiftEntry from './pages/BulkShiftEntry';
import NewShift from './pages/NewShift';
import ShiftReport from './pages/ShiftReport';
import BreakRules from './pages/BreakRules';
import NewBreakRule from './pages/NewBreakRule';
import StaffAttendance from './pages/StaffAttendance';
import NewAttendanceRecord from './pages/NewAttendanceRecord';
import StaffRoles from './pages/StaffRoles';
import NewStaffRole from './pages/NewStaffRole';
import Tasks from './pages/Tasks';
import NewTask from './pages/NewTask';
import TaskReports from './pages/TaskReports';
import OperationAuditQuestions from './pages/OperationAuditQuestions';
import NewOperationAuditQuestion from './pages/NewOperationAuditQuestion';
import OperationAuditSurveys from './pages/OperationAuditSurveys';
import NewOperationAuditSurvey from './pages/NewOperationAuditSurvey';
import OperationAuditSurveyDetail from './pages/OperationAuditSurveyDetail';
import StaffQR from './pages/StaffQR';
import SupportTicket from './pages/SupportTicket';
import MyTickets from './pages/MyTickets';
import BusinessTicketDetail from './pages/BusinessTicketDetail';
import FAQ from './pages/FAQ';
import SientoInvoices from './pages/SientoInvoices';
import DailySales from './pages/DailySales';
import SalesCounts from './pages/SalesCounts';
import CategorySales from './pages/CategorySales';
import Kuver from './pages/Kuver';
import TableReports from './pages/TableReports';
import TableReportDetail from './pages/TableReportDetail';
import AccountDetail from './pages/reports/AccountDetail';
import PersonnelCategorySales from './pages/reports/PersonnelCategorySales';
import PersonnelProductSales from './pages/reports/PersonnelProductSales';
import RevenueGraph from './pages/reports/RevenueGraph';
import PaymentTypeGraph from './pages/reports/PaymentTypeGraph';
import ExpenseGraph from './pages/reports/ExpenseGraph';
import StockConsumption from './pages/reports/StockConsumption';
import StockConsumptionDetail from './pages/reports/StockConsumptionDetail';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBusinesses from './pages/admin/AdminBusinesses';
import AdminNewBusiness from './pages/admin/AdminNewBusiness';
import AdminFAQ from './pages/admin/AdminFAQ';
import RegisterClosings from './pages/RegisterClosings';
import CashClosures from './pages/CashClosures';
import NewCashClosure from './pages/NewCashClosure';
import CashClosureDetail from './pages/CashClosureDetail';
import AdminSupportTickets from './pages/admin/AdminSupportTickets';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';
import AdminEditBusiness from './pages/admin/AdminEditBusiness';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminPaymentSettings from './pages/admin/AdminPaymentSettings';
import AdminResellers from './pages/admin/AdminResellers';
import AdminNewReseller from './pages/admin/AdminNewReseller';
import AdminResellerPayouts from './pages/admin/AdminResellerPayouts';
import AdminResellerSupport from './pages/admin/AdminResellerSupport';
import AdminResellerNotifications from './pages/admin/AdminResellerNotifications';
import AdminResellerContract from './pages/admin/AdminResellerContract';
import AdminResellerMarketing from './pages/admin/AdminResellerMarketing';
import AdminResellerFAQ from './pages/admin/AdminResellerFAQ';
import SientoFaturalari from './pages/isletme/SientoFaturalari';
import ResellerLayout from './pages/reseller/ResellerLayout';
import ResellerDashboard from './pages/reseller/Dashboard';
import ResellerLogin from './pages/reseller/Login';
import ResellerBusinesses from './pages/reseller/ResellerBusinesses';
import ResellerNewBusiness from './pages/reseller/ResellerNewBusiness';
import ResellerBusinessDetail from './pages/reseller/ResellerBusinessDetail';
import ResellerSubscriptions from './pages/reseller/ResellerSubscriptions';
import ResellerCommissions from './pages/reseller/ResellerCommissions';
import ResellerPayments from './pages/reseller/ResellerPayments';
import ResellerMarketing from './pages/reseller/ResellerMarketing';
import ResellerSupport from './pages/reseller/ResellerSupport';
import ResellerTicketDetail from './pages/reseller/ResellerTicketDetail';
import ResellerProfile from './pages/reseller/ResellerProfile';
import { isAdminSubdomain, isResellerSubdomain } from './utils/subdomain';

// Placeholder Components
// Placeholder Components
const QRGen = () => <div className="p-6"><h1 className="text-2xl font-bold">QR Menü Oluştur</h1></div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const isAdminOrReseller = isAdminSubdomain() || isResellerSubdomain();
  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a1a]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-gray-700 opacity-25"></div>
        <div className="absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-[#5D5FEF] border-t-transparent"></div>
      </div>
    </div>
  );
  if (!user) return <Navigate to={isAdminOrReseller ? "/login" : "/"} />;
  return children;
};

function App() {
  const isAdmin = isAdminSubdomain();

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            {isResellerSubdomain() ? (
              /* --- RESELLER SUBDOMAIN ROUTES --- */
              <>
                <Route path="/login" element={<ResellerLogin />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <ResellerLayout>
                      <Routes>
                        <Route path="/" element={<ResellerDashboard />} />
                        <Route path="isletmeler" element={<ResellerBusinesses />} />
                        <Route path="isletmeler/yeni" element={<ResellerNewBusiness />} />
                        <Route path="isletmeler/:id" element={<ResellerBusinessDetail />} />
                        <Route path="isletmeler/:id/:tab" element={<ResellerBusinessDetail />} />
                        <Route path="abonelikler" element={<ResellerSubscriptions />} />
                        <Route path="komisyonlar" element={<ResellerCommissions />} />
                        <Route path="odemeler" element={<ResellerPayments />} />
                        <Route path="marketing" element={<ResellerMarketing />} />
                        <Route path="destek" element={<ResellerSupport />} />
                        <Route path="destek/:tab" element={<ResellerSupport />} />
                        <Route path="destek/talepler/:id" element={<ResellerTicketDetail />} />
                        <Route path="profil" element={<ResellerProfile />} />
                        <Route path="profil/:tab" element={<ResellerProfile />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </ResellerLayout>
                  </ProtectedRoute>
                } />
              </>
            ) : isAdmin ? (
              /* --- ADMIN SUBDOMAIN ROUTES --- */
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="businesses" element={<AdminBusinesses />} />
                        <Route path="new-business" element={<AdminNewBusiness />} />
                        <Route path="notifications" element={<AdminNotifications />} />
                        <Route path="destek/talepler" element={<AdminSupportTickets />} />
                        <Route path="destek/talepler/:id" element={<AdminTicketDetail />} />
                        <Route path="destek/sss" element={<AdminFAQ />} />
                        <Route path="subscriptions" element={<AdminSubscriptions />} />
                        <Route path="payment-settings" element={<AdminPaymentSettings />} />
                        <Route path="resellers" element={<AdminResellers />} />
                        <Route path="resellers/new" element={<AdminNewReseller />} />
                        <Route path="resellers/payouts" element={<AdminResellerPayouts />} />
                        <Route path="resellers/support" element={<AdminResellerSupport />} />
                        <Route path="resellers/notifications" element={<AdminResellerNotifications />} />
                        <Route path="resellers/contract" element={<AdminResellerContract />} />
                        <Route path="resellers/marketing" element={<AdminResellerMarketing />} />
                        <Route path="resellers/faq" element={<AdminResellerFAQ />} />
                        <Route path="resellers/edit/:id" element={<AdminNewReseller />} />
                        <Route path="businesses/edit/:id" element={<AdminEditBusiness />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                } />
              </>
            ) : (
              /* --- MAIN DOMAIN (BUSINESS) ROUTES --- */
              <>
                <Route path="/" element={<Login />} />
                <Route path="/isletme/mesai-qr" element={
                  <ProtectedRoute>
                    <StaffQR />
                  </ProtectedRoute>
                } />
                <Route path="/isletme/pos_react/register_closings" element={
                  <ProtectedRoute>
                    <RegisterClosings />
                  </ProtectedRoute>
                } />
                <Route path="/isletme/*" element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="hesaplar" element={<Accounts />} />
                        <Route path="adisyonlar" element={<OrderHistory />} />
                        <Route path="satilan-urunler" element={<SoldProducts />} />
                        <Route path="odemeler" element={<Payments />} />
                        <Route path="odemeler/:id" element={<PaymentDetail />} />
                        <Route path="urun-pos-tipleri" element={<PosProductTypes />} />
                        <Route path="tedarikciler" element={<Suppliers />} />
                        <Route path="tedarikciler/:id" element={<SupplierDetail />} />
                        <Route path="subeler" element={<Subeler />} />
                        <Route path="oturma-alanlari" element={<SeatingAreas />} />
                        <Route path="oturma-alanlari/:id" element={<SeatingAreaDetail />} />
                        <Route path="oturma-alanlari/:id/yerlesim" element={<SeatingLayoutDesigner />} />
                        <Route path="paket-servis-adresleri" element={<DeliveryAddresses />} />
                        <Route path="faturalar" element={<Invoices />} />
                        <Route path="faturalar/yeni" element={<NewInvoice />} />
                        <Route path="faturalar/duzenle/:id" element={<NewInvoice />} />
                        <Route path="muhasebe-urunleri" element={<InvoiceItems />} />
                        <Route path="maas-bilgileri" element={<PersonnelPayments />} />
                        <Route path="maas-bilgileri/yeni" element={<NewPersonnelPayment />} />
                        <Route path="maas-bilgileri/duzenle/:id" element={<NewPersonnelPayment />} />
                        <Route path="maas-bilgileri/:id" element={<PersonnelPaymentDetail />} />
                        <Route path="musteri-isletmeler" element={<CustomerBusinesses />} />
                        <Route path="kasa-kapanisi" element={<CashClosures />} />
                        <Route path="kasa-kapanisi/yeni" element={<NewCashClosure />} />
                        <Route path="kasa-kapanisi/:id" element={<CashClosureDetail />} />
                        <Route path="kasa-kapanisi/duzenle/:id" element={<NewCashClosure />} />
                        <Route path="musteri-isletmeler/yeni" element={<NewCustomerBusiness />} />
                        <Route path="musteri-isletmeler/duzenle/:id" element={<NewCustomerBusiness />} />
                        <Route path="musteriler" element={<Customers />} />
                        <Route path="opsiyonel-urunler" element={<OptionalProducts />} />
                        <Route path="urun-opsiyonlari" element={<ProductOptions />} />
                        <Route path="urun-opsiyonlari/yeni" element={<NewProductOptionGroup />} />
                        <Route path="urun-opsiyonlari/duzenle/:id" element={<EditProductOptionGroup />} />
                        <Route path="urun-opsiyonlari/:id" element={<ProductOptionDetail />} />
                        <Route path="odeme-yontemleri" element={<PaymentMethods />} />
                        <Route path="odeme-yontemleri/yeni" element={<NewPaymentMethod />} />
                        <Route path="odeme-yontemleri/duzenle/:id" element={<EditPaymentMethod />} />

                        <Route path="depolar" element={<Warehouses />} />
                        <Route path="depolar/yeni" element={<NewWarehouse />} />
                        <Route path="depolar/duzenle/:id" element={<NewWarehouse />} />
                        <Route path="stok-birimleri" element={<StockUnits />} />
                        <Route path="stok-birimleri/yeni" element={<NewStockUnit />} />
                        <Route path="stok-birimleri/duzenle/:id" element={<NewStockUnit />} />
                        <Route path="stoklu-urun-kategorileri" element={<StockCategories />} />
                        <Route path="stoklu-urun-kategorileri/yeni" element={<NewStockCategory />} />
                        <Route path="stoklu-urun-kategorileri/duzenle/:id" element={<NewStockCategory />} />
                        <Route path="stoklu-urunler" element={<StockProducts />} />
                        <Route path="stoklu-urunler/yeni" element={<NewStockProduct />} />
                        <Route path="stoklu-urunler/duzenle/:id" element={<NewStockProduct />} />
                        <Route path="stoklu-urunler/detay/:id" element={<StockProductDetail />} />
                        <Route path="stok-girisi" element={<StockEntries />} />
                        <Route path="stok-girisi/yeni" element={<NewStockEntry />} />
                        <Route path="stok-girisi/duzenle/:id" element={<NewStockEntry />} />
                        <Route path="stok-durumu" element={<StockStatus />} />
                        <Route path="cihazlar" element={<Devices />} />
                        <Route path="cihazlar/yeni" element={<NewDevice />} />
                        <Route path="yazicilar" element={<Printers />} />
                        <Route path="yazicilar/yeni" element={<NewPrinter />} />
                        <Route path="yazicilar/duzenle/:id" element={<EditPrinter />} />
                        <Route path="terminaller" element={<Terminals />} />
                        <Route path="terminaller/yeni" element={<NewTerminal />} />
                        <Route path="indirim-turleri" element={<DiscountTypes />} />
                        <Route path="indirim-turleri/yeni" element={<NewDiscountType />} />
                        <Route path="indirim-turleri/duzenle/:id" element={<EditDiscountType />} />
                        <Route path="ayarlar" element={<Settings />} />
                        <Route path="personeller" element={<StaffManagement />} />
                        <Route path="personeller/duzenle/:id" element={<StaffManagement />} />
                        <Route path="hedefler" element={<Targets />} />
                        <Route path="personel-bildirimleri" element={<StaffNotifications />} />
                        <Route path="mesai-yonetimi" element={<StaffShifts />} />
                        <Route path="mesai-saatler/toplu-giris" element={<BulkShiftEntry />} />
                        <Route path="mesai-saatler/yeni" element={<NewShift />} />
                        <Route path="mesai-saatler/rapor-indir" element={<ShiftReport />} />
                        <Route path="mola-sureleri" element={<BreakRules />} />
                        <Route path="mola-sureleri/yeni" element={<NewBreakRule />} />
                        <Route path="mola-sureleri/duzenle/:id" element={<NewBreakRule />} />
                        <Route path="personel-saat" element={<StaffAttendance />} />
                        <Route path="personel-saat/yeni" element={<NewAttendanceRecord />} />
                        <Route path="personel-rolleri" element={<StaffRoles />} />
                        <Route path="personel-rolleri/yeni" element={<NewStaffRole />} />
                        <Route path="personel-rolleri/duzenle/:id" element={<NewStaffRole />} />
                        <Route path="gorevler" element={<Tasks />} />
                        <Route path="gorevler/yeni" element={<NewTask />} />
                        <Route path="gorevler/duzenle/:id" element={<NewTask />} />
                        <Route path="gorevler/raporlar" element={<TaskReports />} />
                        <Route path="raporlar/satis/gunluk" element={<DailySales />} />
                        <Route path="raporlar/satis/sayilar" element={<SalesCounts />} />
                        <Route path="raporlar/satis/kategori" element={<CategorySales />} />
                        <Route path="raporlar/satis/kuver" element={<Kuver />} />
                        <Route path="raporlar/satis/masa" element={<TableReports />} />
                        <Route path="raporlar/satis/masa/:id" element={<TableReportDetail />} />
                        <Route path="raporlar/satis/hesap/:paymentId" element={<AccountDetail />} />
                        <Route path="raporlar/urun/personel-kategori" element={<PersonnelCategorySales />} />
                        <Route path="raporlar/urun/personel-urun" element={<PersonnelProductSales />} />
                        <Route path="raporlar/finans/gelir-grafigi" element={<RevenueGraph />} />
                        <Route path="raporlar/finans/odeme-tipi" element={<PaymentTypeGraph />} />
                        <Route path="raporlar/finans/gider" element={<ExpenseGraph />} />
                        <Route path="raporlar/stok/tuketim" element={<StockConsumption />} />
                        <Route path="raporlar/stok/tuketim/:id" element={<StockConsumptionDetail />} />
                        <Route path="raporlar/finans/gelir" element={<RevenueGraph />} />
                        <Route path="operasyon-anket-sorulari" element={<OperationAuditQuestions />} />
                        <Route path="operasyon-anket-sorulari/yeni" element={<NewOperationAuditQuestion />} />
                        <Route path="operasyon-anket-sorulari/duzenle/:id" element={<NewOperationAuditQuestion />} />
                        <Route path="operasyon-anketi" element={<OperationAuditSurveys />} />
                        <Route path="operasyon-anketi/yeni" element={<NewOperationAuditSurvey />} />
                        <Route path="operasyon-anketi/:id" element={<OperationAuditSurveyDetail />} />
                        <Route path="qr-menu" element={<QRGen />} />
                        <Route path="menu" element={<MenuManagement />} />
                        <Route path="qr/menu-raporlari/tiklama-raporlari" element={<QRClickReports />} />
                        <Route path="kategoriler" element={<MenuManagement />} />
                        <Route path="kategoriler/:id" element={<CategoryDetail />} />
                        <Route path="kategoriler/:catId/urunler/:productId" element={<ProductDetail />} />
                        <Route path="toplu-fiyat-duzenle" element={<BulkPriceEdit />} />
                        <Route path="kampanyalar" element={<Campaigns />} />
                        <Route path="kampanyalar/yeni" element={<NewCampaign />} />
                        <Route path="kampanyalar/duzenle/:id" element={<EditCampaign />} />
                        <Route path="happy-hour" element={<HappyHourList />} />
                        <Route path="happy-hour/yeni" element={<NewHappyHour />} />
                        <Route path="happy-hour/duzenle/:id" element={<EditHappyHour />} />
                        <Route path="sureli-indirimler" element={<TimedDiscountsList />} />
                        <Route path="sureli-indirimler/yeni" element={<NewTimedDiscount />} />
                        <Route path="qr/menu" element={<QRMenu />} />
                        <Route path="qr/menu/:id" element={<QRMenuDetail />} />
                        <Route path="qr/feedback" element={<QRFeedback />} />
                        <Route path="qr/settings" element={<QRSettings />} />
                        <Route path="destek/talep" element={<SupportTicket />} />
                        <Route path="destek/taleplerim" element={<MyTickets />} />
                        <Route path="destek/taleplerim/:id" element={<BusinessTicketDetail />} />
                        <Route path="destek/sss" element={<FAQ />} />
                        <Route path="siento-faturalari" element={<SientoFaturalari />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/pos/kitchen-display" element={
                  <ProtectedRoute>
                    <KitchenDisplay />
                  </ProtectedRoute>
                } />
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                } />
                <Route path="/qr/home/:id" element={<QRHome />} />
                <Route path="/qr/menu/:id" element={<QRMenuPublic />} />

                {/* Redirect admin path to admin subdomain if accessed from main domain */}
                <Route path="/admin/*" element={<Navigate to="/" replace />} />

                {/* Catch all - Redirect to /isletme */}
                <Route path="*" element={<Navigate to="/isletme" replace />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
