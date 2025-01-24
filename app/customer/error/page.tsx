// app/customer/error/page.tsx
export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">testing commit</h1>
      <p className="text-gray-600">
        Sorry, something went wrong while processing your request.
      </p>
      <p className="text-gray-500 mt-2">
        Please try again later or contact support if the problem persists.
      </p>
      {/* You can add more content or styling as needed */}
    </div>
  );
}
