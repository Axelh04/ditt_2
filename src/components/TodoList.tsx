import React, { useState, useEffect } from 'react';

export type TodoItem = {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed';
  startTime?: number;
  estimatedDuration?: number;
};

export type GenerationProgress = {
  currentStep: number;
  totalSteps: number;
  todos: TodoItem[];
  startTime: number;
  estimatedTotalTime: number;
};

interface TodoListProps {
  progress: GenerationProgress | null;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const TodoList: React.FC<TodoListProps> = ({ progress }) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!progress) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Calculate actual progress based on completed tasks and current task progress
      let calculatedProgress = 0;
      
      for (const todo of progress.todos) {
        if (todo.status === 'completed') {
          calculatedProgress += (1 / progress.totalSteps) * 100;
        } else if (todo.status === 'in-progress' && todo.startTime && todo.estimatedDuration) {
          const taskElapsed = (now - todo.startTime) / 1000;
          const taskProgress = Math.min(taskElapsed / todo.estimatedDuration, 0.95); // Cap at 95% until actually complete
          calculatedProgress += (taskProgress / progress.totalSteps) * 100;
        }
      }

      setCurrentProgress(Math.min(calculatedProgress, 99));
    }, 100);

    return () => clearInterval(interval);
  }, [progress]);

  if (!progress) {
    return null;
  }

  // Calculate estimated remaining time more accurately
  let estimatedRemaining = 0;
  for (const todo of progress.todos) {
    if (todo.status === 'pending' && todo.estimatedDuration) {
      estimatedRemaining += todo.estimatedDuration;
    } else if (todo.status === 'in-progress' && todo.startTime && todo.estimatedDuration) {
      const taskElapsed = (Date.now() - todo.startTime) / 1000;
      estimatedRemaining += Math.max(0, todo.estimatedDuration - taskElapsed);
    }
  }

  const displayPercentage = currentProgress === 100 ? 100 : Math.floor(currentProgress);
  const isComplete = progress.currentStep === progress.totalSteps;

  return (
    <div className="todo-list">
      <div className="todo-header">
        <div className="todo-title">Generation Progress</div>
        <div className="todo-stats">
          <span className="todo-percentage">{displayPercentage}%</span>
          {!isComplete && estimatedRemaining > 0 && (
            <>
              <span className="todo-separator">•</span>
              <span className="todo-estimate">~{formatTime(estimatedRemaining)}</span>
            </>
          )}
        </div>
      </div>
      <div className="todo-progress-bar">
        <div 
          className="todo-progress-fill" 
          style={{ width: `${currentProgress}%` }}
        />
      </div>
      <div className="todo-items">
        {progress.todos.map((todo) => (
          <div key={todo.id} className={`todo-item ${todo.status}`}>
            <div className="todo-icon">
              {todo.status === 'completed' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              )}
              {todo.status === 'in-progress' && (
                <div className="todo-progress-dot"></div>
              )}
              {todo.status === 'pending' && (
                <div className="todo-pending-box"></div>
              )}
            </div>
            <div className="todo-label">{todo.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

