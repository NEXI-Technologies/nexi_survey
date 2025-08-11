import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { db } from "../lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [surveyEvaluations, setSurveyEvaluations] = useState([]);
  const [activeTab, setActiveTab] = useState("responses");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show 50 items per page
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = () => {
    if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      loadData();
    } else {
      setError("Invalid password");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load survey responses (summary data)
      const responsesQuery = query(
        collection(db, "global-survey-responses"),
        orderBy("timestamp", "desc")
      );
      const responsesSnapshot = await getDocs(responsesQuery);
      const responses = responsesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSurveyResponses(responses);

      // Load individual evaluations
      const evaluationsQuery = query(
        collection(db, "global-survey-evaluations"),
        orderBy("timestamp", "desc")
      );
      const evaluationsSnapshot = await getDocs(evaluationsQuery);
      const evaluations = evaluationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSurveyEvaluations(evaluations);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setSurveyResponses([]);
    setSurveyEvaluations([]);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Parse image filename to extract face and bbox coordinates
  const parseImageInfo = (fileName) => {
    if (!fileName) return null;

    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

    // Try to parse the pattern: face{number}-{x1}_{y1}_{x2}_{y2}
    // Example: face87-1014_402_1058_449
    const match = nameWithoutExt.match(/^face(\d+)-(\d+)_(\d+)_(\d+)_(\d+)$/);
    if (match) {
      return {
        face: match[1], // face87
        face_bbox_x1: match[2], // 1014
        face_bbox_y1: match[3], // 402
        face_bbox_x2: match[4], // 1058
        face_bbox_y2: match[5], // 449
      };
    }

    // Fallback: try older pattern face_x1_y1_x2_y2
    const parts = nameWithoutExt.split("_");
    if (parts.length >= 5) {
      return {
        face: parts[0],
        face_bbox_x1: parts[1],
        face_bbox_y1: parts[2],
        face_bbox_x2: parts[3],
        face_bbox_y2: parts[4],
      };
    }

    return { face: nameWithoutExt };
  };

  // Get flattened dataset entries with pagination and search
  const getDatasetEntries = () => {
    // Novo: cada evaluation é uma resposta individual
    const allEntries = surveyEvaluations.map((evaluation) => ({
      evaluation,
      answer: evaluation, // O próprio evaluation é a resposta
      imageInfo: parseImageInfo(evaluation.image?.fileName || evaluation.imageInfo?.fileName),
    }));

    // Filtro de pesquisa
    const filteredEntries = searchTerm
      ? allEntries.filter((entry) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            entry.imageInfo?.face?.toLowerCase().includes(searchLower) ||
            entry.answer.image?.folder?.toLowerCase().includes(searchLower) ||
            entry.answer.answer?.toLowerCase().includes(searchLower) ||
            entry.evaluation.participant?.name?.toLowerCase().includes(searchLower)
          );
        })
      : allEntries;

    // Paginação
    const totalEntries = filteredEntries.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    return {
      entries: paginatedEntries,
      totalEntries,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  };

  const exportToCSV = () => {
    if (activeTab === "dataset") {
      // Export in dataset format for easy integration
      const headers = [
        "dataset",
        "datetime",
        "face",
        "face_bbox_x1",
        "face_bbox_y1",
        "face_bbox_x2",
        "face_bbox_y2",
        "engagement",
        "participant_name",
        "participant_email",
        "survey_timestamp",
      ];

      let csvContent = headers.join(",") + "\n";

      // Novo: cada evaluation é uma resposta individual
      const allEntries = surveyEvaluations.map((evaluation) => ({
        evaluation,
        answer: evaluation,
        imageInfo: parseImageInfo(evaluation.image?.fileName || evaluation.imageInfo?.fileName),
      }));

      allEntries.forEach((entry) => {
        const row = [
          entry.answer.image?.dataset || entry.answer.imageInfo?.dataset || "N/A",
          entry.answer.image?.folder || entry.answer.imageInfo?.folder || "N/A",
          entry.imageInfo?.face || "N/A",
          entry.imageInfo?.face_bbox_x1 || "N/A",
          entry.imageInfo?.face_bbox_y1 || "N/A",
          entry.imageInfo?.face_bbox_x2 || "N/A",
          entry.imageInfo?.face_bbox_y2 || "N/A",
          entry.answer.answer || "N/A",
          entry.evaluation.participant?.name || "Anonymous",
          entry.evaluation.participant?.email || "Anonymous",
          formatDate(entry.answer.timestamp),
        ];
        csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `dataset-engagement-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Original export functionality
      const data =
        activeTab === "responses" ? surveyResponses : surveyEvaluations;
      const headers =
        activeTab === "responses"
          ? [
              "ID",
              "Participant Name",
              "Participant Email",
              "Total Images",
              "Total Questions",
              "Completed At",
            ]
          : [
              "ID",
              "Participant Name",
              "Participant Email",
              "Image Name",
              "Folder",
              "Answer",
              "Question",
              "Timestamp",
            ];

      let csvContent = headers.join(",") + "\n";

      data.forEach((item) => {
        if (activeTab === "responses") {
          const row = [
            item.id,
            item.participant?.name || "Anonymous",
            item.participant?.email || "Anonymous",
            item.totalEvaluationImages || 0,
            item.totalQuestions || 0,
            formatDate(item.timestamp),
          ];
          csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
        } else {
          item.answers?.forEach((answer) => {
            const row = [
              item.id,
              item.participant?.name || "Anonymous",
              item.participant?.email || "Anonymous",
              answer.imageInfo?.imageName || "N/A",
              answer.imageInfo?.dataset || "N/A",
              answer.imageInfo?.folder || "N/A",
              answer.answer || "N/A",
              answer.question || "N/A",
              formatDate(answer.timestamp),
            ];
            csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
          });
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `survey-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
              Admin Access
            </h1>
            <p className="text-slate-600 text-sm">
              Enter password to view survey results
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              className="w-full h-12 px-4 bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-slate-800 placeholder:text-slate-500 focus:bg-white/80 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
            />
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Survey Results Dashboard
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                {surveyResponses.length} total surveys completed
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-slate-500 hover:bg-slate-600 text-white font-medium rounded-xl px-4 py-2"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => {
                setActiveTab("responses");
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "responses"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg"
                  : "bg-white/60 text-slate-700 hover:bg-white/80"
              }`}
            >
              Survey Summaries ({surveyResponses.length})
            </Button>
            <Button
              onClick={() => {
                setActiveTab("evaluations");
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "evaluations"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg"
                  : "bg-white/60 text-slate-700 hover:bg-white/80"
              }`}
            >
              Individual Evaluations ({surveyEvaluations.length})
            </Button>
            <Button
              onClick={() => {
                setActiveTab("dataset");
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "dataset"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg"
                  : "bg-white/60 text-slate-700 hover:bg-white/80"
              }`}
            >
              Dataset Format
            </Button>
            <Button
              onClick={exportToCSV}
              className="ml-auto bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl px-4 py-2"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-700 font-medium">Loading data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "responses"
              ? // Survey Responses
                surveyResponses.map((response) => (
                  <Card
                    key={response.id}
                    className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Participant
                        </h3>
                        <p className="text-sm text-slate-600">
                          Name: {response.participant?.name || "Anonymous"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Email: {response.participant?.email || "Anonymous"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Gender: {response.participant?.gender || "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Age: {response.participant?.ageRange || "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Education: {response.participant?.education || "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Profession: {response.participant?.profession || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Survey Info
                        </h3>
                        <p className="text-sm text-slate-600">
                          Answers: {response.answers?.length || 0}
                        </p>
                        </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Timing
                        </h3>
                        <p className="text-sm text-slate-600">
                          Started:{" "}
                          {response.surveyMetadata?.startedAt
                            ? formatDate(response.surveyMetadata.startedAt)
                            : "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Completed:{" "}
                          {response.surveyMetadata?.completedAt
                            ? formatDate(response.surveyMetadata.completedAt)
                            : formatDate(response.timestamp)}
                        </p>
                        <p className="text-sm text-slate-600">
                          Duration:{" "}
                          {response.surveyMetadata?.sessionDuration != null
                            ? `${Math.floor(response.surveyMetadata.sessionDuration / 60)} min ${response.surveyMetadata.sessionDuration % 60} sec`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              : activeTab === "evaluations"
              ? // Individual Evaluations
                surveyEvaluations.map((evaluation) => (
                  <Card
                    key={evaluation.id}
                    className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Participant
                        </h3>
                        <p className="text-sm text-slate-600">
                          Name: {evaluation.participant?.name || "Anonymous"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Email: {evaluation.participant?.email || "Anonymous"}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Image Evaluated
                        </h3>
                        <p className="text-sm text-slate-600">
                          Name: {evaluation.image?.imageName || evaluation.imageInfo?.imageName || "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Folder: {evaluation.image?.folder || evaluation.imageInfo?.folder || "N/A"}
                        </p>
                        <p className="text-sm text-slate-600">
                          Dataset: {evaluation.image?.dataset || evaluation.imageInfo?.dataset || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Completed
                        </h3>
                        <p className="text-sm text-slate-600">
                          {formatDate(evaluation.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Individual Answers */}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <h3 className="font-semibold text-slate-800 mb-2">
                        Rating
                      </h3>
                      <div className="bg-white/20 rounded-lg ">
                        <p className="text-lg font-bold text-blue-600">
                          {evaluation.answer}
                        </p>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {evaluation.image?.imageUrl && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <h3 className="font-semibold text-slate-800 mb-2">
                          Image
                        </h3>
                        <img
                          src={evaluation.image.imageUrl}
                          alt={evaluation.image.imageName}
                          className="w-32 h-32 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </Card>
                ))
              : activeTab === "dataset"
              ? // Dataset Format View
                (() => {
                  const datasetData = getDatasetEntries();
                  return (
                    <div className="space-y-4">
                      <Card className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">
                              Dataset Integration Format
                            </h3>
                            <p className="text-sm text-slate-600">
                              {datasetData.totalEntries} total entries • Example
                              pattern: face87-1014_402_1058_449.jpg
                            </p>
                          </div>
                          <div className="w-80">
                            <Input
                              type="text"
                              placeholder="Search by face, dataset, engagement..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                              }}
                              className="w-full bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-slate-800 placeholder:text-slate-500 focus:bg-white/80 focus:border-blue-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-blue-50/50 rounded-lg p-4">
                            <h4 className="font-medium text-slate-800 mb-2">
                              Image Filename Pattern:
                            </h4>
                            <p className="text-sm text-slate-600 mb-2">
                              <span className="font-mono bg-white/60 px-2 py-1 rounded">
                                face{"{number}"}-{"{x1}"}_{"{y1}"}_{"{x2}"}_
                                {"{y2}"}.jpg
                              </span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Example: face87-1014_402_1058_449.jpg → face87,
                              bbox(1014,402,1058,449)
                            </p>
                          </div>

                          <div className="bg-green-50/50 rounded-lg p-4">
                            <h4 className="font-medium text-slate-800 mb-2">
                              Dataset Columns Mapping:
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-mono">dataset</span> →
                                Folder name
                              </div>
                              <div>
                                <span className="font-mono">datetime</span> →
                                Subfolder name
                              </div>
                              <div>
                                <span className="font-mono">face</span> →
                                Face number
                              </div>
                              <div>
                                <span className="font-mono">engagement</span> →
                                Survey rating (1-5 / -1)
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Pagination Controls */}
                      {datasetData.totalPages > 1 && (
                        <Card className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-slate-600">
                              Showing {(currentPage - 1) * itemsPerPage + 1}-
                              {Math.min(
                                currentPage * itemsPerPage,
                                datasetData.totalEntries
                              )}{" "}
                              of {datasetData.totalEntries} entries
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setCurrentPage(1)}
                                disabled={!datasetData.hasPrevPage}
                                className="px-3 py-1 text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-lg disabled:opacity-50"
                              >
                                First
                              </Button>
                              <Button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!datasetData.hasPrevPage}
                                className="px-3 py-1 text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-lg disabled:opacity-50"
                              >
                                Previous
                              </Button>
                              <span className="px-3 py-1 text-sm text-slate-600">
                                Page {currentPage} of {datasetData.totalPages}
                              </span>
                              <Button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!datasetData.hasNextPage}
                                className="px-3 py-1 text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-lg disabled:opacity-50"
                              >
                                Next
                              </Button>
                              <Button
                                onClick={() =>
                                  setCurrentPage(datasetData.totalPages)
                                }
                                disabled={!datasetData.hasNextPage}
                                className="px-3 py-1 text-sm bg-white/60 hover:bg-white/80 text-slate-700 rounded-lg disabled:opacity-50"
                              >
                                Last
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Dataset Entries Table */}
                      <div className="space-y-2">
                        {datasetData.entries.map((entry, idx) => (
                          <Card
                            key={`${entry.evaluation.id}-${idx}`}
                            className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-xl shadow-lg shadow-blue-500/10 p-4 hover:bg-white/50 transition-colors"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  Dataset
                                </h4>
                                <p className="text-slate-600 font-mono text-xs truncate">
                                  {entry.answer.image?.dataset || entry.answer.imageInfo?.dataset || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  DateTime
                                </h4>
                                <p className="text-slate-600 font-mono text-xs truncate">
                                  {entry.answer.image?.folder || entry.answer.imageInfo?.folder || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  Face
                                </h4>
                                <p className="text-slate-600 font-mono text-xs font-semibold text-blue-700">
                                  {entry.imageInfo?.face || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  X1
                                </h4>
                                <p className="text-slate-600 font-mono text-xs">
                                  {entry.imageInfo?.face_bbox_x1 || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  Y1
                                </h4>
                                <p className="text-slate-600 font-mono text-xs">
                                  {entry.imageInfo?.face_bbox_y1 || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  X2
                                </h4>
                                <p className="text-slate-600 font-mono text-xs">
                                  {entry.imageInfo?.face_bbox_x2 || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  Y2
                                </h4>
                                <p className="text-slate-600 font-mono text-xs">
                                  {entry.imageInfo?.face_bbox_y2 || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-700 mb-1 text-xs">
                                  Engagement
                                </h4>
                                <p className="text-lg font-bold text-blue-600">
                                  {entry.answer.answer}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center text-xs text-slate-500">
                              <span>
                                {entry.evaluation.participant?.name ||
                                  "Anonymous"}
                              </span>
                              <span>{formatDate(entry.answer.timestamp)}</span>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {datasetData.entries.length === 0 && (
                        <Card className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-center">
                          <p className="text-slate-600">
                            {searchTerm
                              ? `No entries found for "${searchTerm}"`
                              : "No dataset entries available"}
                          </p>
                        </Card>
                      )}
                    </div>
                  );
                })()
              : null}

            {((activeTab === "responses" && surveyResponses.length === 0) ||
              (activeTab === "evaluations" && surveyEvaluations.length === 0) ||
              (activeTab === "dataset" && surveyEvaluations.length === 0)) && (
              <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-center">
                <p className="text-slate-600">No data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
