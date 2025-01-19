const adminDashboard = {
  title: "Admin Dashboard",
  logout: "Logout",
  tabs: {
    kbManagement: "Knowledge Base Management",
    logsAndAnalytics: "Logs & Analytics",
  },
  kbManagement: {
    allKbs: "All Knowledge Bases",
    allKbsDescription: "Create new knowledge bases, delete or modify existing ones here",
    noKbs: "🤔 No Knowledge Bases",
    noKbsDescription:
      'Click the "Create New Knowledge Base" button in the top right to create your first knowledge base',
    kbActions: {
      edit: "Edit",
      delete: "Delete",
      addKb: "Create New Knowledge Base",
      refreshKbList: "Refresh Knowledge Base List",
    },
    newKbDialog: {
      title: "Create New Knowledge Base",
      description: "Please fill in the following information to create a new knowledge base",
      nameLabel: "Name",
      namePlaceholder: "Enter knowledge base name",
      locationLabel: "Location",
      locationPlaceholder: "Enter knowledge base location",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter knowledge base password",
      createBtn: {
        idle: "Create",
        creating: "Creating...",
        createSuccess: "Created Successfully",
        createFailed: "Creation Failed",
      },
      cancelBtn: "Cancel",
    },
    deleteKbDialog: {
      title: "Delete Knowledge Base",
      description:
        'Are you sure you want to delete knowledge base "{name}"? This action cannot be undone.',
      cancelBtn: "Cancel",
      status: {
        idle: "Delete",
        deleting: "Deleting...",
        deleteSuccess: "Deleted Successfully",
        deleteFailed: "Deletion Failed",
      },
    },
  },
};

export default adminDashboard;
