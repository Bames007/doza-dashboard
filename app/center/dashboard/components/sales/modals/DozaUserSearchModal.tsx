import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCheck, Search, Phone, AlertCircle, Loader2 } from "lucide-react";

interface DozaUserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: any) => void;
  centerId: string;
  userId: string;
}

const DozaUserSearchModal: FC<DozaUserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  centerId,
  userId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search users when debounced term changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/doza-users?search=${encodeURIComponent(
            debouncedSearch
          )}&centerId=${centerId}`,
          {
            headers: {
              "x-user-id": userId,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsers(data.data || []);
          }
        }
      } catch (error) {
        console.error("Error searching Doza users:", error);
        // Fallback to mock data for demo
        setUsers([
          {
            id: "doza_001",
            dozaCode: "DOZA001",
            fullName: "John Doe",
            phone: "08012345678",
            email: "john@example.com",
            creditLimit: 50000,
            currentBalance: 15000,
            isActive: true,
          },
          {
            id: "doza_002",
            dozaCode: "DOZA002",
            fullName: "Jane Smith",
            phone: "08087654321",
            email: "jane@example.com",
            creditLimit: 30000,
            currentBalance: 5000,
            isActive: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedSearch.trim()) {
      searchUsers();
    }
  }, [debouncedSearch, centerId, userId]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md mx-2 sm:mx-4"
      >
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Doza User
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Search Doza user by name, phone, or Doza code
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Doza Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter name, phone, or Doza code"
                className="w-full pl-10 pr-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <h3 className="font-medium text-gray-900">
                          {user.fullName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">{user.dozaCode}</p>
                      <p className="text-xs text-gray-500">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {user.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-600">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                        }).format(user.creditLimit || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Credit Limit</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <div className="text-center py-6">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No Doza users found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try searching with a different name, phone, or Doza code
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Search for Doza users</p>
              <p className="text-sm text-gray-500 mt-1">
                Enter a name, phone number, or Doza code to search
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Doza User Information
              </span>
            </div>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Charges go to user's Doza Tab</li>
              <li>• Subject to credit limit approval</li>
              <li>• Monthly billing cycle</li>
              <li>• Receipt will show Doza billing details</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 sm:p-6 flex space-x-2 sm:space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 sm:px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DozaUserSearchModal;
