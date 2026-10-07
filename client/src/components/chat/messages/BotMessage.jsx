import Markdown from "../Markdown";
import ButtonsMessage from "./ButtonsMessage";
import ListMessage from "./ListMessage";
import LinksMessage from "./LinksMessage";
import { bodyOf } from "./utils";

// Picks how a bot message looks, based on its "type"
export default function BotMessage({ message, active, nextUserText, onSelect }) {
  const body = bodyOf(message);
  // buttons and links show their body as ordinary text (usually it is empty)
  const bodyBlock = body ? <Markdown>{body}</Markdown> : null;

  switch (message.type) {
    case "buttons":
      return (
        <ButtonsMessage
          message={message}
          body={bodyBlock}
          active={active}
          chosenText={nextUserText}
          onSelect={onSelect}
        />
      );
    case "list":
      return (
        <ListMessage
          message={message}
          active={active}
          chosenText={nextUserText}
          onSelect={onSelect}
        />
      );
    case "links":
      return <LinksMessage message={message} body={bodyBlock} />;
    default:
      return bodyBlock;
  }
}