import React, { useState, useEffect } from 'react';
import type { ProcessBreakdown } from '../services/geminiService';
import { generateQuiz, type QuizData, type QuizQuestion } from '../services/geminiService';

interface QuizSectionProps {
  processData: ProcessBreakdown;
}

export const QuizSection: React.FC<QuizSectionProps> = ({ processData }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const quiz = await generateQuiz(processData);
      setQuizData(quiz);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setIsStarted(true);
    loadQuiz();
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResults) return;
    
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerIndex
    });
  };

  const handleNext = () => {
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsStarted(false);
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    
    const total = quizData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    
    return { correct, total, percentage };
  };

  if (!isStarted) {
    return (
      <div className="quiz-section">
        <div className="quiz-intro">
          <h2>Test Your Knowledge</h2>
          <p>Ready to see how much you've learned about {processData.processName}?</p>
          <p className="quiz-intro-details">
            Take this quiz to reinforce your understanding. The questions are based on the stages you just explored.
          </p>
          <button onClick={handleStartQuiz} className="quiz-start-button">
            Begin Quiz
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !quizData) {
    return (
      <div className="quiz-section">
        <div className="quiz-loading">
          <div className="spinner"></div>
          <p>Generating quiz questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const score = calculateScore();
  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;
  const allAnswered = quizData.questions.every((_, index) => selectedAnswers[index] !== undefined);

  if (showResults) {
    return (
      <div className="quiz-section">
        <div className="quiz-results">
          <h2>Quiz Complete!</h2>
          <div className="score-display">
            <div className="score-circle">
              <div className="score-percentage">{score.percentage}%</div>
              <div className="score-text">{score.correct} / {score.total}</div>
            </div>
          </div>
          
          <div className="results-feedback">
            {score.percentage >= 80 ? (
              <p className="feedback-excellent">Excellent work! You've mastered the material.</p>
            ) : score.percentage >= 60 ? (
              <p className="feedback-good">Good job! You have a solid understanding.</p>
            ) : (
              <p className="feedback-retry">Keep learning! Review the material and try again.</p>
            )}
          </div>

          <div className="results-breakdown">
            <h3>Review Your Answers</h3>
            {quizData.questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={index} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="result-header">
                    <span className="result-number">Question {index + 1}</span>
                    <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  
                  <div className="result-question">
                    {question.svgReference !== null && (
                      <div className="result-svg-container">
                        <div 
                          className="result-svg-display"
                          dangerouslySetInnerHTML={{ __html: processData.stages[question.svgReference].svg }}
                        />
                        <p className="result-svg-caption">Stage {question.svgReference + 1}: {processData.stages[question.svgReference].stageTitle}</p>
                      </div>
                    )}
                    <p className="result-question-text">{question.question}</p>
                  </div>
                  
                  <div className="result-answers">
                    <div className={`result-answer your-answer ${!isCorrect ? 'wrong' : ''}`}>
                      <strong>Your answer:</strong> {question.options[userAnswer]}
                    </div>
                    {!isCorrect && (
                      <div className="result-answer correct-answer">
                        <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
                      </div>
                    )}
                  </div>
                  
                  <div className="result-explanation">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions">
            <button onClick={handleRestart} className="quiz-restart-button">
              Take Quiz Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-section">
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Knowledge Check</h2>
          <div className="quiz-progress">
            Question {currentQuestionIndex + 1} of {quizData.questions.length}
          </div>
        </div>

        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
          />
        </div>

        <div className="quiz-question-card">
          {currentQuestion.svgReference !== null && (
            <div className="quiz-svg-container">
              <div 
                className="quiz-svg-display"
                dangerouslySetInnerHTML={{ __html: processData.stages[currentQuestion.svgReference].svg }}
              />
              <p className="quiz-svg-caption">
                Stage {currentQuestion.svgReference + 1}: {processData.stages[currentQuestion.svgReference].stageTitle}
              </p>
            </div>
          )}

          <div className="quiz-question">
            <h3>{currentQuestion.question}</h3>
            <p className="quiz-instruction">Select one answer</p>
          </div>

          <div className="quiz-options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
            className="quiz-nav-button"
          >
            ← Previous
          </button>
          
          <div className="quiz-dots">
            {quizData.questions.map((_, index) => (
              <div 
                key={index}
                className={`quiz-dot ${index === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[index] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              />
            ))}
          </div>

          {currentQuestionIndex < quizData.questions.length - 1 ? (
            <button 
              onClick={handleNext}
              disabled={!isAnswered}
              className="quiz-nav-button"
            >
              Next →
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="quiz-submit-button"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

