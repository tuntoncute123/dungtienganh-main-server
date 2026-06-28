import { CardDto } from './create-deck.dto.js';

export class UpdateDeckDto {
  id: string;
  category?: string;
  categoryLabel?: string;
  title?: string;
  isLocked?: boolean;
  type?: string;
  cards?: CardDto[];
}
