import './RoomCodeDisplay.css';

interface RoomCodeDisplayProps {
  roomCode: string;
  isConnected: boolean;
  peersCount: number;
}

const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ roomCode, isConnected, peersCount }) => {
  return (
    <div className="room-code-container">
      <h1>
        {[0,1,2,3].map((i) => (
          <span key={i} style={{ opacity: i < roomCode.length ? 1 : 0.3 }}>
            {i < roomCode.length ? roomCode[i] : '·'}
          </span>
        ))}
      </h1>
      <span className="status-text">{isConnected ? 'Connected with ' + (peersCount ? peersCount + ' peers' : ' no peers') : 'Disconnected'}</span>
    </div>
  );
};

export default RoomCodeDisplay;