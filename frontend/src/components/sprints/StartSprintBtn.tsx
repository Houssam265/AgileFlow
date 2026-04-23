import { Button } from '@mui/material';
import type { MouseEvent } from 'react';

type Props = {
  mode: 'start' | 'finish';
  onClick: () => Promise<void>;
};

const StartSprintBtn = ({ mode, onClick }: Props) => {
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      mode === 'start'
        ? 'Demarrer ce sprint ? Cela mettra fin a tout autre sprint en cours pour ce projet.'
        : 'Terminer ce sprint ? Les taches non terminees seront renvoyees au backlog.',
    );
    if (!confirmed) return;
    await onClick();
  };

  return (
    <Button
      size="small"
      variant="contained"
      color={mode === 'start' ? 'primary' : 'success'}
      onClick={handleClick}
    >
      {mode === 'start' ? 'Demarrer' : 'Terminer'}
    </Button>
  );
};

export default StartSprintBtn;
