import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HQProvider, useHQ } from "@/hq/HQContext";
import HQLogin from "./HQLogin";
import HQLayout from "./HQLayout";
import Overview from "./Overview";
import HQSales from "./HQSales";
import Inventory from "./Inventory";
import Products from "./Products";
import Staff from "./Staff";
import Stores from "./Stores";
import Alerts from "./Alerts";

/** Lets the owner open the older website order/review tools, which check this flag. */
const WebsiteToolsAccess = () => {
  const { isOwner } = useHQ();
  useEffect(() => {
    if (isOwner) localStorage.setItem("toyes_admin_session", "active");
  }, [isOwner]);
  return null;
};

const OwnerOnly = ({ children }: { children: JSX.Element }) => {
  const { isOwner } = useHQ();
  return isOwner ? children : <Navigate to="/admin" replace />;
};

const HQArea = () => (
  <HQProvider>
    <WebsiteToolsAccess />
    <Routes>
      <Route path="login" element={<HQLogin />} />
      <Route path="dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="pos" element={<Navigate to="/pos" replace />} />
      <Route element={<HQLayout />}>
        <Route index element={<Overview />} />
        <Route path="sales" element={<HQSales />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="staff" element={<Staff />} />
        <Route path="products" element={<Products />} />
        <Route path="stores" element={<OwnerOnly><Stores /></OwnerOnly>} />
        <Route path="alerts" element={<OwnerOnly><Alerts /></OwnerOnly>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  </HQProvider>
);

export default HQArea;
