interface UserTabsProps {
  activeTab: 'admin' | 'seller' | 'buyer';
  onTabChange: (tab: 'admin' | 'seller' | 'buyer') => void;
}

export default function UserTabs({ activeTab, onTabChange }: UserTabsProps) {
  const tabs = [
    { id: 'admin', name: 'Admin Users', count: 0 },
    { id: 'seller', name: 'Seller Users', count: 0 },
    { id: 'buyer', name: 'Buyer Users', count: 0 },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
}