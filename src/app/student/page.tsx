"use client";

import { useCareerStore } from "@/hooks/use-career-store";
import { StepIndicator } from "@/components/student/step-indicator";
import { ProfileForm } from "@/components/student/profile-form";
import { CareerRecommendationsView } from "@/components/student/career-recommendations";
import { LearningRoadmapView } from "@/components/student/learning-roadmap";
import { LearningResourcesView } from "@/components/student/learning-resources";
import { ProgressTracker } from "@/components/student/progress-tracker";
import { AiChat } from "@/components/student/ai-chat";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AppStep, UserProfile, LearningRoadmap, LearningResources } from "@/types/student";
import { RotateCcw, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function StudentPathPage() {
  const {
    state,
    isLoaded,
    setStep,
    setProfile,
    setCareerRecommendations,
    selectCareer,
    setRoadmap,
    setResources,
    toggleMilestone,
    togglePhase,
    resetAll,
    setLoadingGenerate,
    setLoadingRoadmap,
    setLoadingResources,
  } = useCareerStore();

  const [showChat, setShowChat] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const disabledSteps: AppStep[] = [];
  if (!state.careerRecommendations) {
    disabledSteps.push("roadmap", "resources", "progress");
  }
  if (!state.roadmap) {
    disabledSteps.push("progress");
  }
  const uniqueDisabled = [...new Set(disabledSteps)];

  const handleProfileSubmit = (profile: UserProfile) => {
    setProfile(profile);
    setStep("careers");
  };

  const handleCareerSelect = (career: string) => {
    selectCareer(career);
    setStep("roadmap");
  };

  const handleRoadmapLoaded = (roadmap: LearningRoadmap) => {
    setRoadmap(roadmap);
  };

  const handleResourcesLoaded = (resources: LearningResources) => {
    setResources(resources);
  };

  const handleResetProgress = () => {
    resetAll();
  };

  const chatContext = [
    state.profile.major && `专业：${state.profile.major}`,
    state.profile.grade && `年级：${state.profile.grade}`,
    state.profile.interests.length > 0 && `兴趣方向：${state.profile.interests.join("、")}`,
    state.profile.skills && `已掌握技能：${state.profile.skills}`,
    state.profile.expectation && `职业期望：${state.profile.expectation}`,
    state.selectedCareer && `当前目标职业：${state.selectedCareer}`,
  ].filter(Boolean).join("；");

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold">CodePath</h1>
                <p className="text-xs text-muted-foreground">AI 驱动的计算机职业规划</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">AI 顾问</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">重新开始</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <StepIndicator
          currentStep={state.step}
          onStepClick={setStep}
          disabledSteps={uniqueDisabled}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <div className={`flex gap-6 ${showChat ? "" : "justify-center"}`}>
          <div className={`${showChat ? "flex-1 min-w-0" : "w-full max-w-3xl"}`}>
            {state.step === "profile" && (
              <ProfileForm
                onSubmit={handleProfileSubmit}
                initialProfile={state.profile}
              />
            )}

            {state.step === "careers" && (
              <CareerRecommendationsView
                profile={state.profile}
                onSelectCareer={handleCareerSelect}
                recommendations={state.careerRecommendations}
                onRecommendationsLoaded={setCareerRecommendations}
                isLoading={state.loadingGenerate}
                onSetLoading={setLoadingGenerate}
              />
            )}

            {state.step === "roadmap" && state.selectedCareer && (
              <LearningRoadmapView
                career={state.selectedCareer}
                profile={state.profile}
                roadmap={state.roadmap}
                onRoadmapLoaded={handleRoadmapLoaded}
                completedMilestones={state.completedMilestones}
                onToggleMilestone={toggleMilestone}
                isLoading={state.loadingRoadmap}
                onSetLoading={setLoadingRoadmap}
              />
            )}

            {state.step === "resources" && state.selectedCareer && (
              <LearningResourcesView
                career={state.selectedCareer}
                skills={state.profile.skills}
                resources={state.resources}
                onResourcesLoaded={handleResourcesLoaded}
                isLoading={state.loadingResources}
                onSetLoading={setLoadingResources}
              />
            )}

            {state.step === "progress" && state.roadmap && state.selectedCareer && (
              <ProgressTracker
                roadmap={state.roadmap}
                career={state.selectedCareer}
                resources={state.resources}
                completedMilestones={state.completedMilestones}
                completedPhases={state.completedPhases}
                onToggleMilestone={toggleMilestone}
                onTogglePhase={togglePhase}
                onReset={handleResetProgress}
              />
            )}

            {state.step !== "profile" && (
              <div className="flex justify-between mt-8 max-w-3xl mx-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    const steps: AppStep[] = ["profile", "careers", "roadmap", "resources", "progress"];
                    const currentIdx = steps.indexOf(state.step);
                    if (currentIdx > 0) setStep(steps[currentIdx - 1]);
                  }}
                >
                  上一步
                </Button>
                <Button
                  onClick={() => {
                    const steps: AppStep[] = ["profile", "careers", "roadmap", "resources", "progress"];
                    const currentIdx = steps.indexOf(state.step);
                    if (currentIdx < steps.length - 1 && !uniqueDisabled.includes(steps[currentIdx + 1])) {
                      setStep(steps[currentIdx + 1]);
                    }
                  }}
                  disabled={
                    (() => {
                      const steps: AppStep[] = ["profile", "careers", "roadmap", "resources", "progress"];
                      const currentIdx = steps.indexOf(state.step);
                      return currentIdx >= steps.length - 1 || uniqueDisabled.includes(steps[currentIdx + 1]);
                    })()
                  }
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  下一步
                </Button>
              </div>
            )}
          </div>

          {showChat && (
            <div className="w-80 shrink-0 hidden lg:block">
              <div className="sticky top-32">
                <AiChat context={chatContext} />
              </div>
            </div>
          )}
        </div>
      </main>

      {showChat && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-background border-t rounded-t-xl shadow-lg max-h-[70vh] overflow-hidden">
          <div className="p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium px-2">AI 职业顾问</span>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              收起
            </Button>
          </div>
          <div className="h-[calc(70vh-48px)]">
            <AiChat context={chatContext} />
          </div>
        </div>
      )}
    </div>
  );
}
