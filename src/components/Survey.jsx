import React, { useState } from "react";
import { Button } from "./ui/button";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const Survey = ({ images, participant, onComplete }) => {
  // images is an array of groups: [{ contextImage, evaluationImages }]
  // Create a linear array of { contextImage, evaluationImage, groupIndex, imageIndex }
  const flatImages = images.flatMap((group, groupIdx) =>
    group.evaluationImages.map((img, imgIdx) => ({
      contextImage: group.contextImage,
      evaluationImage: img,
      groupIndex: groupIdx,
      imageIndex: imgIdx,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [startTime] = useState(Date.now());

  const questions = [
    {
      id: 1,
      text: "Rate the engagement level of the student in this image:",
      type: "rating",
      options: ["1", "2", "3", "4", "5", "Unknown"],
    },
  ];

  const ratingLabels = {
    "1": "Not engaged at all",
    "2": "Slightly engaged",
    "3": "Moderately engaged",
    "4": "Very Engaged",
    "5": "Totally engaged",
    "Unknown": "Unclear image",
  };

  const totalQuestions = flatImages.length;
  const progress =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const getCurrentAnswer = () => answers[currentIndex]?.answer || "";

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    const { evaluationImage, contextImage, groupIndex, imageIndex } =
      flatImages[currentIndex];

    newAnswers[currentIndex] = {
      questionId: questions[0].id,
      question: questions[0].text,
      answer,
      imageInfo: {
        folder: evaluationImage.folder,
        fileName: evaluationImage.fileName,
        imageName: evaluationImage.name,
        imageUrl: evaluationImage.url,
        dataset: evaluationImage.datasetName,
      },
      contextInfo: {
        folder: contextImage.folder,
        fileName: contextImage.fileName,
        imageName: contextImage.name,
        imageUrl: contextImage.url,
        dataset: contextImage.datasetName,
      },
      groupIndex,
      imageIndex,
      timestamp: new Date(),
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save each evaluation individualy
      const evaluationPromises = flatImages.map((item, idx) => {
        const answer = answers[idx];
        if (!answer) return null;
        const imageEvaluation = {
          participant,
          image: answer.imageInfo,
          contextImage: answer.contextInfo,
          answer: answer.answer,
          completedAt: new Date(),
          timestamp: new Date(),
        };
        return addDoc(collection(db, "global-survey-evaluations"), imageEvaluation);
      });
      await Promise.all(evaluationPromises.filter(Boolean));

      // Calculate session time
      const sessionDuration = Math.round((Date.now() - startTime) / 1000);

      // Save summary session
      const surveyResult = {
        participant,
        answers,
        totalEvaluationImages: flatImages.length,
        totalQuestions: 1,
        timestamp: new Date(),
        surveyMetadata: {
          sessionDuration,
          startedAt: new Date(startTime),
          completedAt: new Date(),
        },
      };
      await addDoc(collection(db, "global-survey-responses"), surveyResult);

      onComplete();
    } catch (error) {
      alert("Error submitting survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canGoBack = currentIndex > 0;

  const { contextImage, evaluationImage } = flatImages[currentIndex];

  const getFaceNumber = (fileName) => {
    // Example: face2-156_87_270_218.jpg → return "2"
    const match = fileName.match(/^face(\d+)-/);
    return match ? match[1] : "";
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-6xl">
        <div className="backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-xl shadow-blue-500/10 p-8">
          {/* Progress Section */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-medium text-slate-500 tracking-wide">
              Image {currentIndex + 1} of {flatImages.length}
            </span>
            <div className="flex-1 mx-4 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Images Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Context Image */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-slate-600 mb-3 text-center">
                Context Image
              </h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-white/20 backdrop-blur-sm">
                <img
                  src={contextImage.url}
                  alt="Reference context"
                  className="w-full h-80 object-contain bg-slate-100"
                />
                <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                  Context
                </div>
                {/* Botão de expandir */}
                <button
                  type="button"
                  onClick={() => setShowContextModal(true)}
                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold shadow transition"
                  title="Expandir imagem"
                >
                  🔍︎ Expand
                </button>
              </div>
            </div>
            {/* Evaluation Image */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium text-slate-600 mb-3 text-center">
                Image to Evaluate
              </h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-white/20 backdrop-blur-sm">
                <img
                  src={evaluationImage.url}
                  alt={`image-to-evaluate-${evaluationImage.fileName}`}
                  className="w-full h-80 object-contain bg-slate-100"
                />
                <div className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                  Evaluate
                </div>
              </div>
              {/* Nome da imagem */}
              <div className="mt-2 text-center text-xs text-slate-500">
                <span className="font-semibold">
                  Face {getFaceNumber(evaluationImage.fileName)}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Image Modal */}
          {showContextModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="relative">
                <img
                  src={contextImage.url}
                  alt="Context expanded"
                  className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl border-4 border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowContextModal(false)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold shadow transition"
                  title="Close"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          )}

          {/* Question */}
          <h2 className="text-lg font-semibold text-slate-800 text-left mt-10 mb-2 leading-relaxed">
            {questions[0].text}
          </h2>
          <p className="text-xs text-slate-600 mb-6 text-left">
            Face identified by the square with the number{" "}
            {getFaceNumber(evaluationImage.fileName)} in the context image.
          </p>

          {/* Answer Options */}
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
              {questions[0].options.map((option, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className={`min-h-[5rem] rounded-xl text-base font-medium transition-all duration-200 flex flex-col items-center justify-center px-2 ${
                    getCurrentAnswer() === option
                      ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25 scale-[1.03]"
                      : "bg-white/60 hover:bg-white/80 text-slate-700 border border-white/60 hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <span className="font-bold text-xl break-words text-center">
                    {option}
                  </span>
                  <span className="text-xs mt-1 leading-tight text-center whitespace-normal break-words">
                    {ratingLabels[option]}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              onClick={handleBack}
              disabled={!canGoBack}
              className="flex-1 h-11 bg-white/60 hover:bg-white/80 text-slate-700 border border-white/60 hover:border-slate-200 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!getCurrentAnswer()}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
            >
              {isLastQuestion ? "Submit Survey" : "Next"}
            </Button>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-700 font-medium">
                Submitting your evaluation...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Survey;
