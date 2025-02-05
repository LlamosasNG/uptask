import { useLocation } from "react-router-dom";

export default function EditTaskData() {
  const location = useLocation();
  console.log(location.search);    
  return <div>EditTaskData</div>;
}
