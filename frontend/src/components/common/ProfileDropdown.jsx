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
        <button className="neo-button min-h-0 flex items-center space-x-3 py-2 pl-2 pr-3 focus:outline-none">
          <div className="h-8 w-8 rounded-full bg-neo-accent flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-neo-text">
              {user?.name || 'Admin User'}
            </div>
            <div className="text-xs text-neo-muted">{currentDate}</div>
          </div>
          <FaChevronDown className="h-4 w-4 text-neo-muted" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="neo-surface-soft min-w-56 p-2 z-50"
          sideOffset={5}
          align="end"
        >
          {/* User Info Section */}
          <div className="px-3 py-4 border-b neo-divider">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-neo-accent flex items-center justify-center text-white font-semibold">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neo-text truncate">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-xs text-neo-muted truncate">
                  {user?.email || 'admin@agromet.ai'}
                </div>
                <div className="text-xs text-neo-muted">
                  {getUserRole()} • Joined {getJoinDate()}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <DropdownMenu.Item asChild>
              <button className="flex items-center w-full px-3 py-2 text-sm text-neo-text hover:bg-white/60 rounded-full focus:outline-none focus:bg-white/60 transition-colors">
                <FaUser className="h-4 w-4 mr-3 text-neo-muted" />
                Profile Settings
              </button>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <button className="flex items-center w-full px-3 py-2 text-sm text-neo-text hover:bg-white/60 rounded-full focus:outline-none focus:bg-white/60 transition-colors">
                <FaQuestionCircle className="h-4 w-4 mr-3 text-neo-muted" />
                Help & Support
              </button>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="h-px bg-neo-border my-2" />

          {/* Logout */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-full focus:outline-none focus:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Arrow className="fill-[var(--neo-surface)] drop-shadow-sm" />
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
