import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import PropTypes from "prop-types";
import {
  FaUser,
  FaQuestionCircle,
  FaSignOutAlt,
  FaChevronDown
} from "react-icons/fa";

const ProfileDropdown = ({ user, onLogout }) => {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserRole = () => {
    return user?.role || 'Administrator';
  };

  const getJoinDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });
    }
    return "Jan 2025";
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center space-x-3 pl-2 pr-1 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-700">
              {user?.name || 'Admin User'}
            </div>
            <div className="text-xs text-gray-500">{currentDate}</div>
          </div>
          <FaChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
          sideOffset={5}
          align="end"
        >
          {/* User Info Section */}
          <div className="px-3 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@triagro.ai'}
                </div>
                <div className="text-xs text-gray-400">
                  {getUserRole()} • Joined {getJoinDate()}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <DropdownMenu.Item asChild>
              <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:bg-gray-50 transition-colors">
                <FaUser className="h-4 w-4 mr-3 text-gray-400" />
                Profile Settings
              </button>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none focus:bg-gray-50 transition-colors">
                <FaQuestionCircle className="h-4 w-4 mr-3 text-gray-400" />
                Help & Support
              </button>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />

          {/* Logout */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Arrow className="fill-white drop-shadow-sm" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

ProfileDropdown.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};

export default ProfileDropdown;