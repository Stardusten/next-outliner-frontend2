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
      addKb: "Create New KB",
      refreshKbList: "Refresh KB List",
      shrink: "Shrink",
    },
    newKbDialog: {
      title: "Create New KB",
      description: "Please fill in the following information to create a new KB",
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
    shrinkKbDialog: {
      title: "Shrink Knowledge Base",
      description: 'Are you sure you want to shrink knowledge base "{name}"?',
      beforeSize: "Size before shrinking: {size}",
      afterSize: "Size after shrinking: {size}",
      cancelBtn: "Cancel",
      status: {
        idle: "Shrink",
        shrinking: "Shrinking...",
        shrinkSuccess: "Shrink Successful",
        shrinkFailed: "Shrink Failed",
      },
    },
  },
};

export default adminDashboard;
