export const FancyLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin" />
    </div>
  );
};