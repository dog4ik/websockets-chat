import React, { ForwardedRef, HTMLProps } from "react";
interface Props extends HTMLProps<HTMLInputElement> {
  label: string;
  required?: boolean;
}
const Input = React.forwardRef(
  (props: Props, ref: ForwardedRef<HTMLInputElement>) => {
    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          className="peer h-10 w-full select-none rounded-lg border-2 border-gray-300 pl-2 text-gray-900 placeholder-transparent focus:outline-none"
          placeholder="placeholder"
        />
        <label
          className={`pointer-events-none absolute left-2 top-0 select-none text-xs text-gray-400 transition-all peer-placeholder-shown:top-1.5 peer-placeholder-shown:text-lg peer-focus:top-0 peer-focus:text-xs ${
            props.required && "after:text-red-500 after:content-['*']"
          }`}
        >
          {props.label}
        </label>
      </div>
    );
  }
);
Input.displayName = "CustomInput";
export default Input;
