import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VisualBuilderProvider } from "./contexts/VisualBuilderContext";
import VisualBuilderInspector from "./components/VisualBuilderInspector";
import { lazy, Suspense } from "react";
import HolidayDecorations from "./components/HolidayDecorations";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ShippingReturnsRefunds = lazy(() => import("./pages/ShippingReturnsRefunds"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PaymentRedirect = lazy(() => import("./pages/PaymentRedirect"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));

function AdminLoader() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <AdminPanel />
    </Suspense>
  );
}

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/account" component={Account} />
      <Route path="/account/orders" component={Account} />
      <Route path="/order/:orderNumber" component={OrderDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/shipping" component={ShippingReturnsRefunds} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/pay/:orderNumber" component={PaymentRedirect} />
      <Route path="/admin" component={AdminLoader} />
      <Route path="/admin/:section" component={AdminLoader} />
      <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <VisualBuilderProvider>
          <TooltipProvider>
            <Toaster />
            <HolidayDecorations />
            <VisualBuilderInspector />
            <Router />
          </TooltipProvider>
        </VisualBuilderProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
