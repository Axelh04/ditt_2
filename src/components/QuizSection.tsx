import React, { useState } from 'react';
import type { ProcessBreakdown } from '../services/geminiService';
import { generateQuiz, type QuizData } from '../services/geminiService';

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
          <div className="academic-badge">Quiz Time</div>
          <h2>Ready to Test Your Knowledge?</h2>
          <p className="quiz-topic">Let's see what you learned about <span className="highlight">{processData.processName}</span></p>
          
          <div className="quiz-metrics">
            <div className="metric-card">
              <div className="metric-value">{processData.stages.length}</div>
              <div className="metric-label">Stages</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">5-10</div>
              <div className="metric-label">Questions</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">~5</div>
              <div className="metric-label">Min</div>
            </div>
          </div>

          <p className="quiz-intro-details">
            Think you've got it? This quiz will help you remember the key concepts 
            from each stage. Don't worry—you'll get instant feedback and explanations 
            for every question, so it's a great way to learn even more.
          </p>

          <div className="quiz-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Get answers explained right away</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>See the diagrams you studied</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Track how well you did</span>
            </div>
          </div>

          <button onClick={handleStartQuiz} className="quiz-start-button">
            Start Quiz →
          </button>
          
          <p className="academic-note">
            * Questions generated based on what you just learned
          </p>
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

