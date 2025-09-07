import { useLocation } from "react-router-dom";
import Production from "../components/Production";

export default function ProductionPage() {
  const location = useLocation();

  // ✅ 1. Check navigation state first
  let prefillDate = location.state?.prefillDate || null;

  // ✅ 2. If not found, check query params
  if (!prefillDate) {
    const params = new URLSearchParams(location.search);
    const queryDate = params.get("date");
    if (queryDate) {
      prefillDate = queryDate;
    }
  }

  return <Production prefillDate={prefillDate} />;
}
