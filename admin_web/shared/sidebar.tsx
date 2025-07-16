import Logo from "./logo";
import { useRouter } from "next/router";
import LogoutIcon from "@mui/icons-material/Logout";

function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("Token");
    router.replace("/auth/login");
  };
  return (
    <div className="h-full w-full p-3 flex flex-col bg-slate-200">
      <div className="flex-[0.2] basis-0 relative h-full w-full">
        <Logo />
      </div>
      <div className="flex-[0.8] basis-0 flex flex-col self-center">
        {/* admins */}
        <div className="p-3 flex flex-col">
          <div className="py-3">Admin</div>
          <button
            onClick={() => router.push("/addAdmin")}
            className={`p-3 my-1 hover:bg-cbluel hover:text-white rounded-full ${
              router.pathname === "/addAdmin" && "bg-cblue text-white"
            }`}>
            Add Admin
          </button>
          <button
            onClick={() => router.push("/viewAdmins")}
            className={`p-3 my-1 hover:bg-cbluel hover:text-white rounded-full ${
              router.pathname === "/viewAdmins" && "bg-cblue text-white"
            }`}>
            View Admins
          </button>
        </div>

        {/* machines */}
        <div className="p-3 flex flex-col">
          <div className="py-3">Machines</div>
          <button
            onClick={() => router.push("/addMachine")}
            className={`p-3 my-1 hover:bg-cbluel hover:text-white rounded-full ${
              router.pathname === "/addMachine" && "bg-cblue text-white"
            }`}>
            Add Machine
          </button>
          <button
            onClick={() => router.push("/viewMachines")}
            className={`p-3 my-1 hover:bg-cbluel hover:text-white rounded-full ${
              router.pathname === "/viewMachines" && "bg-cblue text-white"
            }`}>
            View Machines
          </button>
        </div>

        {/* items */}
        <button
          onClick={() => router.push("/items")}
          className={`p-3 my-1 text-left hover:bg-cbluel hover:text-white rounded-full ${
            router.pathname === "/items" && "bg-cblue text-white"
          }`}>
          Items
        </button>

        {/* orders */}
        <button
          onClick={() => router.push("/orders")}
          className={`p-3 my-1 text-left hover:bg-cbluel hover:text-white rounded-full ${
            router.pathname === "/orders" && "bg-cblue text-white"
          }`}>
          Orders
        </button>

        {/* view feedbacks */}
        <button
          onClick={() => router.push("/feedbacks")}
          className={`p-3 my-1 text-left hover:bg-cbluel hover:text-white rounded-full ${
            router.pathname === "/feedbacks" && "bg-cblue text-white"
          }`}>
          FeedBacks
        </button>
      </div>
      <button
        className="m-auto p-3 pr-12 hover:bg-gray-300 rounded-lg"
        onClick={handleLogout}>
        <LogoutIcon /> LOGOUT
      </button>
    </div>
  );
}

export default Sidebar;
