export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">

      {/* Hero Section */}
      <section id="home" className="flex flex-col items-center justify-center text-center py-20 px-4 bg-blue-50">
        <h2 className="text-4xl font-extrabold text-blue-700 mb-4">Welcome to ToothSync</h2>
        <p className="max-w-xl text-lg">A clinic resource management system for dental operations — built to streamline service requests, access control, and incident tracking.</p>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">About the System</h3>
          <p className="text-gray-600 leading-relaxed">
            ToothSync is designed for clinical environments that follow structured workflows. It supports service request automation, role-based access, and real-time event and incident management, built on the ITIL v3 Service Operation framework. With this, the clinical operations become more efficient, reducing delays and ensuring a better experience for both students and instructors.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-center py-4 border-t text-sm text-gray-500">
        © 2025 ToothSync. All rights reserved.
      </footer>
    </div>
  );
}
