import { Editor, JSONContent } from "@tiptap/react";
import { ContextItemWithId, InputModifiers } from "core";
import { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { defaultBorderRadius, vscBackground } from "..";
import { useAppSelector } from "../../redux/hooks";
import { selectSlashCommandComboBoxInputs } from "../../redux/selectors";
import ContextItemsPeek from "./belowMainInput/ContextItemsPeek";
import { ToolbarOptions } from "./InputToolbar";
import { Lump } from "./Lump";
import TipTapEditor from "./tiptap/TipTapEditor";

interface ContinueInputBoxProps {
  isEditMode?: boolean;
  isLastUserInput: boolean;
  isMainInput?: boolean;
  onEnter: (
    editorState: JSONContent,
    modifiers: InputModifiers,
    editor: Editor,
  ) => void;
  editorState?: JSONContent;
  contextItems?: ContextItemWithId[];
  hidden?: boolean;
  inputId: string; // used to keep track of things per input in redux
}

const EDIT_DISALLOWED_CONTEXT_PROVIDERS = [
  "codebase",
  "tree",
  "open",
  "web",
  "diff",
  "folder",
  "search",
  "debugger",
  "repo-map",
];

const gradient = keyframes`
  0% {
    background-position: 0px 0;
  }
  100% {
    background-position: 100em 0;
  }
`;

const GradientBorder = styled.div<{
  borderRadius?: string;
  borderColor?: string;
  loading: 0 | 1;
}>`
  border-radius: ${(props) => props.borderRadius || "0"};
  padding: 1px;
  background: ${(props) =>
    props.borderColor
      ? props.borderColor
      : `repeating-linear-gradient(
      101.79deg,
      #1BBE84 0%,
      #331BBE 16%,
      #BE1B55 33%,
      #A6BE1B 55%,
      #BE1B55 67%,
      #331BBE 85%,
      #1BBE84 99%
    )`};
  animation: ${(props) => (props.loading ? gradient : "")} 6s linear infinite;
  background-size: 200% 200%;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

function ContinueInputBox(props: ContinueInputBoxProps) {
  const isStreaming = useAppSelector((state) => state.session.isStreaming);
  const availableSlashCommands = useAppSelector(
    selectSlashCommandComboBoxInputs,
  );
  const availableContextProviders = useAppSelector(
    (state) => state.config.config.contextProviders,
  );
  const editModeState = useAppSelector((state) => state.editModeState);

  const filteredSlashCommands = props.isEditMode ? [] : availableSlashCommands;
  const filteredContextProviders = useMemo(() => {
    if (!props.isEditMode) {
      return availableContextProviders ?? [];
    }

    return (
      availableContextProviders?.filter(
        (provider) =>
          !EDIT_DISALLOWED_CONTEXT_PROVIDERS.includes(provider.title),
      ) ?? []
    );
  }, [availableContextProviders]);

  const historyKey = props.isEditMode ? "edit" : "chat";
  const placeholder = props.isEditMode
    ? "Describe how to modify the code - use '#' to add files"
    : undefined;

  const toolbarOptions: ToolbarOptions = props.isEditMode
    ? {
        hideAddContext: false,
        hideImageUpload: false,
        hideUseCodebase: true,
        hideSelectModel: false,
        enterText: editModeState.editStatus === "accepting" ? "Retry" : "Edit",
      }
    : {};

  const [lumpOpen, setLumpOpen] = useState(true);

  return (
    <div className={`${props.hidden ? "hidden" : ""}`}>
      <div className={`relative flex flex-col px-2`}>
        {props.isMainInput && <Lump open={lumpOpen} setOpen={setLumpOpen} />}
        <GradientBorder
          loading={isStreaming && props.isLastUserInput ? 1 : 0}
          borderColor={
            isStreaming && props.isLastUserInput ? undefined : vscBackground
          }
          borderRadius={defaultBorderRadius}
        >
          <TipTapEditor
            editorState={props.editorState}
            onEnter={props.onEnter}
            placeholder={placeholder}
            isMainInput={props.isMainInput ?? false}
            availableContextProviders={filteredContextProviders}
            availableSlashCommands={filteredSlashCommands}
            historyKey={historyKey}
            toolbarOptions={toolbarOptions}
            lumpOpen={lumpOpen}
            setLumpOpen={setLumpOpen}
            inputId={props.inputId}
          />
        </GradientBorder>
      </div>
      <ContextItemsPeek
        contextItems={props.contextItems}
        isCurrentContextPeek={props.isLastUserInput}
      />
    </div>
  );
}

export default ContinueInputBox;
