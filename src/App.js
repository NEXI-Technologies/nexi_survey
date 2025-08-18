import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { Button } from "./components/ui/button";
import Survey from "./components/Survey";
import DemographicsForm from "./components/DemographicsForm";
import Admin from "./components/Admin";
import { useImageLoader } from "./hooks/useImageLoader";

const SurveyApp = () => {
  const [participant, setParticipant] = useState({ name: "", email: "" });
  const [started, setStarted] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [showDemographics, setShowDemographics] = useState(false); // NOVO

  const {
    selectedImages,
    loadingImages,
    error,
    loadImagesWithFolderLogic,
    resetImages,
  } = useImageLoader();

  const handleStart = () => {
    setShowDemographics(true);
  };

const handleDemographicsSubmit = async (demographics) => {
  setParticipant((prev) => ({ ...prev, ...demographics }));
  setShowDemographics(false);
  try {
    // load images
    const groups = await loadImagesWithFolderLogic();

    if (groups.length > 0) {
      // start survey if exists images available
      setStarted(true);
    } else {
      alert("The survey is completly answered.");
      setStarted(false);
    }
  } catch (error) {
    alert("Failed to load survey. Please try again.");
    setStarted(false);
  }
};

  const handleSurveyComplete = () => {
    setSurveyCompleted(true);
    alert(
      "Thank you for your responses! Your evaluation has been submitted successfully."
    );
  };

  const handleStartNewSurvey = () => {
    setStarted(false);
    setSurveyCompleted(false);
    setParticipant({ name: "", email: "" });
    setShowDemographics(false);
    resetImages();
  };

  // Show survey completion page
  if (surveyCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Survey Complete!
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Thank you for participating in our student engagement evaluation
            study. Your responses have been saved successfully.
            You  can close this window.
          </p>
          <Button
            onClick={handleStartNewSurvey}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Show loading screen while images are being loaded
  if (loadingImages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8 text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading survey images...</p>
        </div>
      </div>
    );
  }

  if (showDemographics) {
    return (
      <DemographicsForm
        initial={participant}
        onSubmit={handleDemographicsSubmit}
        onCancel={() => setShowDemographics(false)}
      />
    );
  }

  // Show survey if started and images are loaded
  if (started && selectedImages.length > 0) {
    return (
      <Survey
        images={selectedImages}
        participant={participant}
        onComplete={handleSurveyComplete}
      />
    );
  }

  // Show welcome page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Glass morphism card */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl shadow-blue-500/10 p-8 transition-all duration-500 hover:shadow-3xl hover:shadow-blue-500/20">
          {/* Header Section */}
          <div className="mb-8">
            {/* Centered logo */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-24 h-auto drop-shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-lg opacity-50"></div>
              </div>
            </div>

            {/* Centered title */}
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight">
              Student Engagement
              <br />
              <span className="text-2xl font-light">
                Evaluation Questionnaire
              </span>
            </h1>

            <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto text-left">
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                This academic research study aims to evaluate <strong>student engagement</strong> during classroom sessions through visual analysis of classroom images.
              </p>

              <p className="text-slate-600 text-base leading-relaxed mb-6">
                <strong>Student engagement</strong> refers to the depth of a student's involvement in the learning process—how <span className="font-semibold">attentive</span>, <span className="font-semibold">interested</span>, and <span className="font-semibold">committed</span> they are to participating in educational activities. It encompasses both the <span className="font-semibold">visible actions</span> students take, such as <span className="font-semibold">contributing in class</span> or <span className="font-semibold">staying focused</span>, and the <span className="font-semibold">less visible attitudes</span> that drive those actions, like <span className="font-semibold">curiosity</span>, <span className="font-semibold">motivation</span>, and a <span className="font-semibold">sense of belonging</span>.
              </p>

              <p className="text-slate-600 text-base leading-relaxed mb-6">
                If you have any questions or would like more information about the study, 
                please do not hesitate to contact me at 
                <a href="mailto:daniel.furtado@nexi.plus" className="text-blue-600 underline ml-1">
                  daniel.furtado@nexi.plus
                </a>.
              </p>
            </div>
          </div>


          {/* Instructions Section */}
          <div className="mb-8 space-y-3">

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Please answer this questionnaire <span className="font-semibold">only once</span>.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Assess the engagement level of the person shown in the <span className="font-semibold">Image to Evaluate</span>.
              </p>
            </div>


            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Rate each face from <span className="font-semibold">1</span> (Not engaged at all) to <span className="font-semibold">5</span> (Totally engaged).
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Select <span className="font-semibold">"Unkown"</span> if the face is unclear or if the image does not correspond to a face.
              </p>
            </div>



            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                A <span className="font-semibold">Context Image</span> of the room will be shown to help you understand the overall setting.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                In the <span className="font-semibold">Context Image</span>, all detected faces are marked with a green square to help with identification.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Each <span className="font-semibold">square is numbered</span> to match the corresponding face in the <span className="font-semibold">Image to Evaluate</span>.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-slate-500 mt-2.5 flex-shrink-0"></div>
              <p className="text-slate-700 text-sm">
                Estimated time: <span className="font-semibold">~5 minutes</span> • <span className="font-semibold">Anonymous & confidential</span>.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">Error: {error}</p>
            </div>
          )}

          {/* Form Section */}
          <div className="space-y-4">
            <Button
              onClick={handleStart}
              disabled={loadingImages}
              className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loadingImages ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Setting up survey...
                </div>
              ) : (
                "Start Survey"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SurveyApp />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
