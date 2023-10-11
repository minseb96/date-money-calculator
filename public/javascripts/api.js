const getMoneyElement = () => {
    return document.querySelector('#money-value');
}

const onClickChargeMoney = async (isWeekday) => {
    const separator = isWeekday ? "WEEKDAY" : "WEEKEND";

    const {data: {amount}} = await axios({
        url: `/money/config/${separator}`,
        method: "GET",
        headers: {"Content-Type": "application/json"}
    });

    console.log("api given value", amount);

    const moneyEl = getMoneyElement();
    moneyEl.innerText += amount;
}

const onClickRollbackChange = () => {

    console.log("rollback change");
}

const onClickSaveChange = () => {
    console.log("save change");
    const moneyEl = getMoneyElement();
    console.log("indicate money", Number(moneyEl.innerText));
}