import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

type ActiveAlert = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

const queue: ActiveAlert[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  queue.push({ title, message, buttons });
  notify();
}

export function CustomAlertProvider() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const theme = useTheme();

  useEffect(() => {
    const onChange = () => setAlerts([...queue]);
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const alert = alerts[0];
  const buttons = alert?.buttons?.length ? alert.buttons : undefined;

  function handlePress(index: number) {
    const button = buttons?.[index];
    queue.shift();
    notify();
    if (button?.onPress) button.onPress();
  }

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (buttons && buttons.length > 0) {
          handlePress(buttons.length - 1);
        } else {
          queue.shift();
          notify();
        }
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[styles.card, { backgroundColor: theme.backgroundElement }]}
        >
          {alert ? (
            <>
              <Text style={[styles.title, { color: theme.text }]}>
                {alert.title}
              </Text>
              {alert.message ? (
                <Text
                  style={[styles.message, { color: theme.textSecondary }]}
                >
                  {alert.message}
                </Text>
              ) : null}
              <View style={styles.buttons}>
                {(buttons ?? [{ text: "OK" }]).map((button, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.button,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.backgroundSelected,
                      },
                    ]}
                    onPress={() => handlePress(index)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === "destructive" && styles.destructive,
                        button.style === "cancel" && [
                          styles.cancel,
                          { color: theme.text },
                        ],
                        !button.style && styles.action,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: Spacing.five,
  },
  card: {
    width: 300,
    maxWidth: "100%",
    borderRadius: 14,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: "stretch",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: Spacing.two,
  },
  buttons: {
    marginTop: Spacing.three,
  },
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 22,
  },
  destructive: {
    color: "#ff3b30",
  },
  cancel: {
    fontWeight: "600",
  },
  action: {
    color: "#3c87f7",
  },
});
