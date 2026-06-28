export class CardDto {
  front: string;
  back: string;
}

export class CreateDeckDto {
  category: string;
  categoryLabel?: string;
  title: string;
  isLocked?: boolean;
  type?: string;
  cards?: CardDto[];
}
