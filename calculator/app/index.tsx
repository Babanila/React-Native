import React, { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

const digitsArray = [
  { key: "Seven", digit: "7" },
  { key: "Eight", digit: "8" },
  { key: "Nine", digit: "9" },
  { key: "Four", digit: "4" },
  { key: "Five", digit: "5" },
  { key: "Six", digit: "6" },
  { key: "One", digit: "1" },
  { key: "Two", digit: "2" },
  { key: "Three", digit: "3" },
  { key: "Zero", digit: "0" },
  { key: "Dot", digit: "." },
  { key: "Space", digit: " " },
];

const operatorsArray = [
  { key: "Divide", operand: "/" },
  { key: "Multiplication", operand: "x" },
  { key: "Plus", operand: "+" },
  { key: "Minus", operand: "-" },
];

const modifierArray = [
  { key: "Clear", modifier: "CLR" },
  { key: "Delete", modifier: "DEL" },
  { key: "Equal", modifier: "=" },
];

const operatorSymbols = operatorsArray.map((op) => op.operand);
const modifierSymbols = modifierArray.map((mod) => mod.modifier);

type ButtonProps = {
  title: string;
  onPress: () => void;
  inputStyles?: ViewStyle;
  buttonTextStyles?: Record<string, string | number>;
};

const ButtonX = memo(
  function ButtonX({
    title,
    onPress,
    inputStyles = {},
    buttonTextStyles = { color: "white", fontSize: 24 },
  }: ButtonProps) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.customButton,
          pressed && styles.buttonPressed,
          inputStyles,
        ]}
        onPress={onPress}
        accessibilityLabel={`${title}-button`}
      >
        <Text style={buttonTextStyles}>{title}</Text>
      </Pressable>
    );
  }
);

type ScreenProps = {
  value: string;
};

const Screen = ({ value }: ScreenProps) => (
  <Text style={styles.screen}>{value}</Text>
);

const Separator = () => <View style={styles.separator} />;

export default function Index() {
  const [result, setResult] = useState("");
  const [allInput, setAllInput] = useState<string[]>([]);

  const evaluateExpression = useCallback(() => {
    const completeExpression = result ? [...allInput, result] : [...allInput];

    if (completeExpression.length === 0 || completeExpression[0] === "") {
      setResult("Error");
      return;
    }

    if (completeExpression.length % 2 === 0) {
      setResult("Error");
      return;
    }

    let total = Number.parseFloat(completeExpression[0]);
    if (isNaN(total)) {
      setResult("Error");
      return;
    }

    for (let i = 1; i < completeExpression.length; i += 2) {
      const operator = completeExpression[i];
      const nextValue = completeExpression[i + 1];

      // Validate we have both operator and next value
      if (!operator || !nextValue) {
        setResult("Error");
        return;
      }

      const num = Number.parseFloat(nextValue);
      if (isNaN(num)) {
        setResult("Error");
        return;
      }

      switch (operator) {
        case "+":
          total += num;
          break;
        case "-":
          total -= num;
          break;
        case "x":
          total *= num;
          break;
        case "/":
          if (num === 0) {
            setResult("Error");
            return;
          }
          total /= num;
          break;
        default:
          setResult("Error");
          return;
      }
    }

    setResult(total.toString());
    setAllInput([]);
  }, [result, allInput]);

  const handleInputPress = useCallback(
    (input: string) => {
      if (input === " ") return;

      if (
        !operatorSymbols.includes(input) &&
        !modifierSymbols.includes(input)
      ) {
        setResult((prev) => {
          if (input === "." && prev.includes(".")) return prev;
          return prev + input;
        });
      }

      // Handle operators
      if (operatorSymbols.includes(input)) {
        if (result !== "") {
          setAllInput((prev) => [...prev, result, input]);
          setResult("");
        } else if (allInput.length > 0) {
          // Replace last operator if no current result
          setAllInput((prev) => [...prev.slice(0, -1), input]);
        }
        // If both result and allInput are empty
        return;
      }

      // Handle modifiers
      if (modifierSymbols.includes(input)) {
        if (input === "DEL") {
          setResult((prev) => prev.slice(0, -1));
        } else if (input === "CLR") {
          setResult("");
          setAllInput([]);
        } else if (input === "=") {
          evaluateExpression();
        }
      }
    },
    [allInput, evaluateExpression, result]
  );

  const makeHandlePress = useCallback(
    (input: string) => () => {
      handleInputPress(input);
    },
    [handleInputPress]
  );

  return (
    <View>
      <Separator />
      <Text style={styles.heading}>Calculator</Text>
      <Text style={styles.subHeading}>For Basic Operations</Text>

      <Separator />
      <Text style={styles.expression} numberOfLines={1}>
        {allInput.join(" ")} {result}
      </Text>
      <Separator />
      <Screen value={result || "0"} />
      <Separator />

      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <View style={styles.digitContainer}>
            {digitsArray.map(({ key, digit }) => (
              <ButtonX
                key={key}
                title={digit}
                onPress={makeHandlePress(digit)}
                inputStyles={styles.digitItem}
              />
            ))}
          </View>

          <View style={styles.operandContainer}>
            {operatorsArray.map(({ key, operand }) => (
              <ButtonX
                key={key}
                title={operand}
                onPress={makeHandlePress(operand)}
                inputStyles={{ width: "100%" }}
              />
            ))}
          </View>
        </View>

        <View style={styles.modificationContainer}>
          {modifierArray.map(({ key, modifier }) => (
            <ButtonX
              key={key}
              title={modifier}
              onPress={makeHandlePress(modifier)}
              inputStyles={styles.digitItem}
              buttonTextStyles={{ fontSize: 20, color: "white", fontWeight: modifier === "=" ? "bold" : "normal" }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    alignSelf: "center",
  },
  subHeading: {
    width: "auto",
    fontSize: 16,
    alignSelf: "center",
  },
  separator: {
    marginVertical: 10,
  },
  expression: {
    fontSize: 16,
    color: "gray",
    textAlign: "right",
    paddingHorizontal: 14,
  },
  screen: {
    backgroundColor: "white",
    borderColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    fontSize: 48,
  },
  inputWrapper: {
    width: "100%",
    flexDirection: "column",
    gap: 20,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
  },
  digitContainer: {
    width: "80%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  digitItem: {
    width: "25%",
  },
  operandContainer: {
    width: "20%",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customButton: {
    backgroundColor: "#0e1724",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
