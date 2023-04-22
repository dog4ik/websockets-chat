import { FaImage } from "react-icons/fa";

type Props = {
  haveFile: boolean;
  onUpload: (buf: Uint8Array) => void;
};
const InputFile = ({ haveFile, onUpload }: Props) => {
  return (
    <>
      <button className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
        <label
          htmlFor="file"
          className="flex h-5/6 w-5/6 cursor-pointer items-center justify-center rounded-full bg-neutral-800"
        >
          <FaImage fill="white" className="pointer-events-none" size={20} />
        </label>
        <input
          className="hidden"
          id="file"
          type="file"
          accept=".jpeg,.jpg,.png"
          onChange={(e) => {
            const reader = new FileReader();
            reader.onload = function () {
              const arrayBuf = this.result;
              if (typeof arrayBuf != "string" && arrayBuf) {
                onUpload(new Uint8Array(arrayBuf));
              }
            };
            if (e.currentTarget.files)
              reader.readAsArrayBuffer(e.currentTarget.files[0]);
          }}
        />
      </button>
    </>
  );
};

export default InputFile;
