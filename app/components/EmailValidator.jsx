"use client";
import axios from "axios";
import { FileText, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ResultsList from "./ResultList";

export default function EmailValidator() {
  const [file, setFile] = useState(null);
  const [emailColumn, setEmailColumn] = useState("");
  const [validationResults, setValidationResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  // const [progress, setProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(2);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !emailColumn) {
      toast.error("Please select a file and enter an email column");
      return;
    }

    // Validate file extension
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are allowed");
      return;
    }

    setIsUploading(true);
    // setProgress(0);

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append("emailColumn", emailColumn);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // onUploadProgress: (progressEvent) => {
        //   const percentCompleted = Math.round(
        //     (progressEvent.loaded * 100) / (progressEvent.total || 1)
        //   );
        //   setProgress(percentCompleted);
        // },
      });

      const { fileName, recordId } = response.data;

      // Add the new record optimistically
      setValidationResults((prev) => [
        {
          id: recordId,
          originalFileName: file.name,
          status: "processing",
          // csvPath: fileName.split(/[/\\]/).pop(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setPage(1); // Reset to the first page
      pollForResults(fileName, recordId);
    } catch (error) {
      setIsUploading(false);
      toast.error(
        error.response?.data?.error || "Upload failed. Please try again."
      );
    }
  };

  const pollForResults = async (fileName, recordId) => {
    try {
      const response = await axios.get(`${apiUrl}/results/${recordId}`);

      if (response.data.status === "completed") {
        // Update the specific record in state
        setValidationResults((prev) =>
          prev.map((item) =>
            item.id === recordId
              ? {
                  ...response.data,
                  originalFileName: file.name, // Keep the original filename
                }
              : item
          )
        );

        setIsUploading(false);
        // setProgress(100);
        setFile(null);
        setEmailColumn("");
        toast.success("Validation completed successfully!");
      } else {
        setTimeout(() => pollForResults(fileName, recordId), 5000);
      }
    } catch (error) {
      console.error("Error polling for results:", error);
      setIsUploading(false);
      toast.error("An error occurred while fetching results.");
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/results?page=${page}&limit=${limit}`
        );
        const data = await response.json();
        if (data && Array.isArray(data.dbResults)) {
          // Normalize csvPath slashes and extract just the filename for download
          const processed = data.dbResults.map((result) => {
            const csvFilename = result.csvPath.split(/[/\\]/).pop();
            return {
              ...result,
              csvPath: csvFilename,
            };
          });
          setValidationResults(processed);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch validation results:", error);
      }
    };

    fetchResults();
  }, [page, limit]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 ">
      <div className="max-w-4xl mx-auto border border-gray-700 shadow-lg rounded-lg p-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Email Validator
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSV File
              </label>
              <div className="flex-1">
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                    {file ? (
                      <div className="flex items-center text-blue-600">
                        <FileText className="mr-2" />
                        <span>{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <Upload className="mr-2" />
                        <span>Choose a file</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => {
                      const selected = e.target.files[0];
                      if (selected && !selected.name.endsWith(".csv")) {
                        toast.error("Only CSV files are allowed");
                        return;
                      }
                      setFile(selected);
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Column Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                value={emailColumn}
                onChange={(e) => {
                  setEmailColumn(e.target.value);
                }}
                placeholder="Enter email column name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-md disabled:bg-slate-400 transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <span className="mr-2">Validating... </span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                "Validate Emails"
              )}
            </button>
          </form>
        </div>

        <ResultsList
          validationResults={validationResults}
          apiUrl={apiUrl}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          limit={limit}
          setLimit={setLimit}
        />
      </div>
    </div>
  );
}
