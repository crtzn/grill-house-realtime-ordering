import { useWindowWidth } from "@react-hook/window-size";

export default function useWindowSize() {
  const onlyWidth = useWindowWidth();
  const mobileWidth = onlyWidth < 768;

  return mobileWidth;
}
