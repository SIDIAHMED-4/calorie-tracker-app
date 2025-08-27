import {createContext, useState} from "react";
import {getDateFromString} from "@utils";

export const AppContext = createContext({
	currentDate: new Date(),
	setCurrentDate: (val) => {},
	totalCalories: 0,
	setTotalCalories: (val) => {},
	currentDateStr: "",
	isValidDate: false,
});

export function AppContextProvider(props) {
	const {children} = props;
	const [currentDate, setCurrentDate] = useState(getDateFromString(new Date()));
	const [totalCalories, setTotalCalories] = useState(0);

	const updateCurrentDate = (val) => {
		setCurrentDate(getDateFromString(val));
	};
	console.log("Curr", currentDate);

	const currentDateStr = currentDate ?? "";

	return (
		<AppContext.Provider
			value={{
				currentDate,
				setCurrentDate: updateCurrentDate,
				totalCalories,
				setTotalCalories,
				currentDateStr,
				isValidDate: !!currentDateStr,
			}}
		>
			{children}
		</AppContext.Provider>
	);
}
