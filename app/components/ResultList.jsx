import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileDown,
  Trash2,
} from "lucide-react";

const ResultsList = ({
  validationResults,
  apiUrl,
  page,
  setPage,
  totalPages,
  limit,
  setLimit,
  handleDelete,
}) => {
  const handlePageClick = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1); // reset to page 1
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Validation Results
        </h2>

        {/* Results Per Page Selector */}
        <div className="flex items-center justify-end mb-4">
          <label className="mr-2 text-sm font-medium text-gray-700">
            Show:
          </label>
          <select
            className="border border-gray-300 px-2 py-1 rounded"
            value={limit}
            onChange={handleLimitChange}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {validationResults.length === 0 ? (
        <div className="text-center text-gray-500 border">
          <p>No validation results found. Upload a CSV file to begin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {validationResults.map((result, index) => (
            <div
              key={result.id?.toString() || result.originalFileName || index}
              className="border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow transition-shadow"
            >
              {/* File title */}
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">
                  {result.originalFileName?.replace(/\.csv$/i, "")}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(result.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Status block */}
              <div className="w-full sm:w-2/3">
                <div className="flex justify-between  mb-2">
                  <div className="text-sm font-bold text-gray-700 mb-2">
                    Status: {result.status}
                  </div>
                  <div className="">
                    <Trash2
                      className="w-5 h-5 text-red-700 cursor-pointer"
                      onClick={() => handleDelete(result.id)}
                    />
                  </div>
                </div>

                {result.status === "processing" ||
                result.status === "pending" ? (
                  <div className="flex items-center text-blue-600">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Processing...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-sm">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {result.valid} valid
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {result.syntaxInvalid} syntax invalid
                    </div>
                    <div className="flex items-center text-purple-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {result.dnsInvalid} DNS invalid
                    </div>
                    <div className="flex items-center text-red-600">
                      <XCircle className="w-4 h-4 mr-1" />
                      {result.disposable} disposable
                    </div>
                  </div>
                )}

                {/* Download buttons */}
                {result.status === "completed" && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {result.reportFilename && (
                      <a
                        href={`${apiUrl}/download/${result.reportFilename}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        download
                      >
                        <FileDown className="w-4 h-4" />
                        Download Report
                      </a>
                    )}
                    {result.validFilename && (
                      <a
                        href={`${apiUrl}/download/${result.validFilename}`}
                        className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                        download
                      >
                        <FileDown className="w-4 h-4" />
                        Valid Emails
                      </a>
                    )}
                    {result.invalidFilename && (
                      <a
                        href={`${apiUrl}/download/${result.invalidFilename}`}
                        className="flex items-center gap-1 text-red-600 hover:underline text-sm"
                        download
                      >
                        <FileDown className="w-4 h-4" />
                        Invalid Emails
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => handlePageClick(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white text-gray-700 border-gray-300 hover:bg-slate-300 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>

            {Array.from(
              { length: Math.min(totalPages, 3) },
              (_, i) => i + 1
            ).map((p) => (
              <button
                key={p}
                onClick={() => handlePageClick(p)}
                className={`px-3 py-1 mx-0.5 border rounded ${
                  page === p
                    ? "bg-slate-900 text-white"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-slate-300"
                }`}
              >
                {p}
              </button>
            ))}

            {totalPages > 3 && (
              <>
                <span className="px-2">...</span>
                <button
                  onClick={() => handlePageClick(totalPages)}
                  className={`px-3 py-1 border rounded ${
                    page === totalPages
                      ? "bg-slate-900 text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-slate-300"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageClick(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded bg-white text-gray-700 border-gray-300 hover:bg-slate-300 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsList;
