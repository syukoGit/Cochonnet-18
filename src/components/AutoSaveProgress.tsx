import './AutoSaveProgress.css';
import { useAutoSave } from '../hooks/useAutoSave';

interface AutoSaveProgressProps {
  size: number;
  strokeWidth: number;
}

export default function AutoSaveProgress({
  size,
  strokeWidth,
}: AutoSaveProgressProps) {
  const { manualSave, progress, formattedTimeUntilNextSave } = useAutoSave();

  const handleManualSave = () => {
    const success = manualSave();
    if (success) {
      console.log('Manual save triggered from global progress indicator');
    }
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="circular-progress-container"
      onClick={handleManualSave}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
      }}
      title={`Cliquer pour sauvegarder maintenant. Prochaine sauvegarde dans ${formattedTimeUntilNextSave}`}
    >
      <svg className="circular-progress-svg" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="circular-progress-background"
          stroke="#e6e6e6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="circular-progress-foreground"
          stroke="#fe1b00"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* Save icon in center */}
      <div className="circular-progress-icon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17,21 17,13 7,13 7,21" />
          <polyline points="7,3 7,8 15,8" />
        </svg>
      </div>
    </div>
  );
}
