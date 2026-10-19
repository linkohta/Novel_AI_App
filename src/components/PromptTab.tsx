import type { ChangeEvent, RefObject } from 'react';
import PromptSection from './PromptSection';
import CharactersSection from './CharactersSection';
import VibeTransferSection from './VibeTransferSection';
import type { NamedItem, SectionState } from '../types/domain';
import type { UseCharactersResult } from '../hooks/useCharacters';
import type { UseVibeTransferResult } from '../hooks/useVibeTransfer';
import { handleSingleFile } from '../utils/fileInput';

interface PromptTabProps {
  sectionState: SectionState;
  onSectionToggle: (id: string, open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  onFocusField: (key: string) => void;
  onLoadImageMetadata: (e: ChangeEvent<HTMLInputElement>) => void;
  // useCharactersの戻り値をそのまま受け取る（キャラクター一覧＋「キャラクター名で追加」フォーム）。
  charactersApi: UseCharactersResult;
  chunks: NamedItem[];
  templates: NamedItem[];
  nameInputRef: RefObject<HTMLInputElement | null>;
  // useVibeTransferの戻り値をそのまま受け取る。
  vibeApi: UseVibeTransferResult;
}

// 左パネル「プロンプト」タブの中身：プロンプト本文・キャラクタープロンプト・
// AIポーション。状態は持たず、App.tsxの各フックの戻り値を各セクションへ配線するだけ。
export default function PromptTab({
  sectionState,
  onSectionToggle,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  onFocusField,
  onLoadImageMetadata,
  charactersApi,
  chunks,
  templates,
  nameInputRef,
  vibeApi,
}: PromptTabProps) {
  return (
    <>
      <PromptSection
        open={!!sectionState.promptSection}
        onToggle={onSectionToggle}
        prompt={prompt}
        setPrompt={setPrompt}
        negativePrompt={negativePrompt}
        setNegativePrompt={setNegativePrompt}
        onFocusField={onFocusField}
        onLoadImageMetadata={onLoadImageMetadata}
      />

      <CharactersSection
        open={!!sectionState.characterSection}
        onToggle={onSectionToggle}
        characters={charactersApi.characters}
        onChangeCharacter={charactersApi.updateCharacterField}
        onRemoveCharacter={charactersApi.removeCharacter}
        onAddBlankCharacter={charactersApi.addBlankCharacter}
        onFocusField={onFocusField}
        chunks={chunks}
        templates={templates}
        charNameByName={charactersApi.charNameByName}
        setCharNameByName={charactersApi.setCharNameByName}
        charSeriesByName={charactersApi.charSeriesByName}
        setCharSeriesByName={charactersApi.setCharSeriesByName}
        charNameSource={charactersApi.charNameSource}
        setCharNameSource={charactersApi.setCharNameSource}
        charNameNegativeSource={charactersApi.charNameNegativeSource}
        setCharNameNegativeSource={charactersApi.setCharNameNegativeSource}
        onAddByName={charactersApi.handleAddByName}
        nameInputRef={nameInputRef}
      />

      <VibeTransferSection
        open={!!sectionState.vibeSection}
        onToggle={onSectionToggle}
        vibeTransferImages={vibeApi.vibeTransferImages}
        onAddImage={(e) => handleSingleFile(e, vibeApi.addVibeTransferImage)}
        onAddSetFile={(e) => handleSingleFile(e, vibeApi.addVibeTransferSetFile)}
        onRemoveImage={vibeApi.removeVibeTransferImage}
        onChangeImageField={vibeApi.updateVibeTransferImageField}
        onBalanceStrengths={vibeApi.balanceVibeTransferStrengths}
      />
    </>
  );
}
