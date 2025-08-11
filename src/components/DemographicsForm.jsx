import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const genders = ["Male", "Female", "Other", "Rather not say"];
const ageRanges = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
  "Rather not say"
];
const educations = [
  "No formal education",
  "High school diploma",
  "College degree",
  "Bachelor’s degree",
  "Master’s degree",
  "Doctorate",
  "Other",
  "Rather not say"
];

const professions = [
  "Student",
  "University Teacher",
  "High School Teacher",
  "Elementary School Teacher",
  "Other",
  "Rather not say"
];

const DemographicsForm = ({ initial = {}, onSubmit, onCancel }) => {
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [gender, setGender] = useState(initial.gender || "");
  const [ageRange, setAgeRange] = useState(initial.ageRange || "");
  const [education, setEducation] = useState(initial.education || "");
  const [profession, setProfession] = useState(initial.profession || "");

  // const isValid =
    // gender !== "" && ageRange !== "" && education !== "" && profession !== "";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="backdrop-blur-xl bg-white/50 border border-white/50 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-center font-bold text-center bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight">
            Demographic Information
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Before begin, please take a moment to answer the following questions. Your responses are completely optional, but they help us better understand your profile.
          </p>
          <p  className="text-sm text-slate-600 mb-8 font-semibold">
            Feel free to skip any question you're not comfortable with!
          </p>

          {/* Campos de nome e email */}
          <div className="space-y-4 mb-8">
            <Input
              type="text"
              placeholder="Full Name (Optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl text-slate-800 placeholder:text-slate-500 focus:bg-white/80 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
            />
            <Input
              type="email"
              placeholder="Email Address (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl text-slate-800 placeholder:text-slate-500 focus:bg-white/80 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
            />
          </div>

          <div className="space-y-10">
            <div>
              <label className="block font-medium mb-1">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {genders.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 rounded-xl border transition-all duration-150 text-sm font-medium ${
                      gender === g
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                        : "bg-white border-slate-300 text-slate-700 hover:shadow-sm"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Age Range</label>
              <div className="grid grid-cols-2 gap-2">
                {ageRanges.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgeRange(a)}
                    className={`px-4 py-2 rounded-xl border transition-all duration-150 text-sm font-medium ${
                      ageRange === a
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                        : "bg-white border-slate-300 text-slate-700 hover:shadow-sm"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Education Level</label>
              <div className="grid grid-cols-2 gap-2">
                {educations.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEducation(e)}
                    className={`px-4 py-2 rounded-xl border transition-all duration-150 text-sm font-medium ${
                      education === e
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                        : "bg-white border-slate-300 text-slate-700 hover:shadow-sm"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Job</label>
              <div className="grid grid-cols-2 gap-2">
                {professions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProfession(p)}
                    className={`px-4 py-2 rounded-xl border transition-all duration-150 text-sm font-medium ${
                      profession === p
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                        : "bg-white border-slate-300 text-slate-700 hover:shadow-sm"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {onCancel && (
              <Button
                variant="secondary"
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() =>
                onSubmit({
                  name,
                  email,
                  gender,
                  ageRange,
                  education,
                  profession,
                })
              }
              // disabled={!isValid}    // Don't proceed if are empty fields
              className="flex-1 h-11 rounded-xl"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicsForm;
