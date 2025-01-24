// app/customer/invalid-qr/page.tsx
export default function InvalidQRPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid QR Code</h1>
      <p className="text-gray-600">
        This QR code is not valid or does not exist in our system.
      </p>
      {/* You can add more content or styling as needed */}
    </div>
  );
}
