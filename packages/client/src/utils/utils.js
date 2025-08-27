import {formatDate} from "date-fns";
export function getDateFromString(dateString) {
	// We will replace this with date-fns

	// const tokens = dateString.split("-");
	// return new Date(Number(tokens[0]), Number(tokens[1]) - 1, Number(tokens[2]));

	// Optimum solution using date-fns
	return formatDate(new Date(dateString), "yyyy-MM-dd");
}
