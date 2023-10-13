var express = require('express');
var router = express.Router();
var dynamoDB = require('../utils/database');

/* GET home page. */
router.get('/', async (req, res, next) => {
  const tableName = 'MONEY_SUM';
  const params = {
    TableName: tableName,
    KeyConditionExpression: "ID = :ID",
    ExpressionAttributeValues: {
      ":ID": 1
    }
  }
  const { Items } = await dynamoDB.query(params).promise();
  const configuration = await getMoneyConfiguration();
  const weekdayPrice = configuration.Items[0].WEEKDAY_PRICE;
  const weekendPrice = configuration.Items[0].WEEKEND_PRICE;

  res.render('index', { restMoney: Items[0].REST_MONEY, weekdayPrice, weekendPrice });
});

router.put('/money/config', async (req, res) => {
  const { weekdayPrice, weekendPrice } = req.body;
  if(await putMoneyConfiguration(weekdayPrice, weekendPrice)) {
    return res.status(200).json({status: "OK", message: "설정을 저장하였습니다."});
  }
  return res.status(200).json({status: "FAIL", message: "설정을 저장하는데 문제가 발생 하였습니다."});
})

router.put('/money/deposit/:separator', async (req, res) => {
  const separator = req.params.separator;
  const { amount } = req.body;

  const {SEPARATOR} = await getExceedObj(separator);
  if(SEPARATOR !== 'NOT_FOUND') {
    return res.status(200).json({amount: amount, message: "하루 지급 금액을 초과 하였습니다."});
  }
  await putDailyRecord(separator);

  const {Items} = await getMoneyConfiguration();
  const depositMoney = separator === "weekday" ? Items[0].WEEKDAY_PRICE : Items[0].WEEKEND_PRICE;
  await updateMoney(depositMoney + amount);
  return res.status(200).json({amount: amount + depositMoney, message: `${depositMoney.toLocaleString("ko-KR")}원이 충전 되었습니다.`});
});

router.put('/money/rollback', async (req, res, next) => {
  const { amount } = req.body;
  const {SEPARATOR} = await getExceedObj();
  if(SEPARATOR === "NOT_FOUND") {
    return res.status(200).json({amount: amount, message: `회수할 금액이 존재하지 않습니다.`});
  }
  const {Items} = await getMoneyConfiguration();

  let rollbackPrice = 0;
  switch(SEPARATOR) {
    case "weekday":
      rollbackPrice = Items[0].WEEKDAY_PRICE;
      break;
    case "weekend":
      rollbackPrice = Items[0].WEEKEND_PRICE;
      break;
  }

  await updateMoney(amount - rollbackPrice);
  await deleteDailyRecord();
  return res.status(200).json({amount: amount - rollbackPrice, message: `${rollbackPrice.toLocaleString("ko-KR")}원이 회수 되었습니다.`});
});

router.put('/money/pay', async (req, res, next) => {
  const { amount, currentAmount } = req.body;

  await updateMoney(currentAmount - amount);
  return res.status(200).json({amount: currentAmount - amount, message: `등록 되었습니다.`});
})

const getMoneyConfiguration = async () => {
  const moneyConfigurationTable = 'MONEY_CONFIGURATION';
  const params = {
    TableName: moneyConfigurationTable,
    KeyConditionExpression: "ID = :ID",
    ExpressionAttributeValues: {
      ":ID": 1
    }
  }
  return await dynamoDB.query(params).promise();
}

const putMoneyConfiguration = async (weekdayPrice, weekendPrice) => {
  const table = 'MONEY_CONFIGURATION';
  const params = {
    TableName: table,
    Key: {
      "ID": 1
    },
    UpdateExpression: "SET WEEKDAY_PRICE = :WEEKDAY_PRICE, WEEKEND_PRICE = :WEEKEND_PRICE",
    ExpressionAttributeValues: {
      ":WEEKDAY_PRICE": weekdayPrice,
      ":WEEKEND_PRICE": weekendPrice
    }
  };
  try {
    await dynamoDB.update(params).promise();
  } catch (e) {
    console.log("error during update money configuration", e);
    return false;
  }
  return true;
}

const updateMoney = async (amount) => {
  const moneySumTable = 'MONEY_SUM';
  const params = {
    TableName: moneySumTable,
    Key: {
      "ID": 1
    },
    UpdateExpression: "SET REST_MONEY = :REST_MONEY",
    ExpressionAttributeValues: {
      ":REST_MONEY": amount
    }
  };
  try {
    await dynamoDB.update(params).promise();
  } catch (e) {
    console.log("error during insert deposit money", e);
    return false;
  }
  return true;
}

const getParsedDate = (todayDate) => {
  return `${todayDate.getFullYear()}-${(todayDate.getMonth()+1).toString().padStart(2,0)}-${todayDate.getDate().toString().padStart(2,0)}`;
}

const deleteDailyRecord = async () => {
  const tableName = 'MONEY_LIMIT_SCHEDULE';
  const todayDate = new Date();
  const parsedDate = getParsedDate(todayDate);
  await dynamoDB.delete({
    TableName: tableName,
    Key: {
      "ID": 1,
      "INSERTED_DT": parsedDate
    }
  }).promise();
}

const putDailyRecord = async (separator) => {
  const moneyLimitScheduleTable = 'MONEY_LIMIT_SCHEDULE';
  const todayDate = new Date();
  const parsedDate = getParsedDate(todayDate);
  const params = {
    TableName: moneyLimitScheduleTable,
    Item: {
      "ID": 1,
      "INSERTED_DT": parsedDate,
      "SEPARATOR": separator
    }
  };
  try {
    await dynamoDB.put(params).promise();
  } catch (e) {
    console.log("error during insert the daily data", e);
    return false;
  }
  return true;
}

const getExceedObj = async () => {
  const tableName = 'MONEY_LIMIT_SCHEDULE';
  const todayDate = new Date();
  const parsedDate = getParsedDate(todayDate);
  const params = {
    TableName: tableName,
    FilterExpression: "INSERTED_DT = :INSERTED_DT",
    ExpressionAttributeValues: {
      ":INSERTED_DT": parsedDate
    }
  };

  const { Items } = await dynamoDB.scan(params).promise();
  if (Items.length) {
    return Items[0];
  }
  return {SEPARATOR: "NOT_FOUND"};
}

module.exports = router;
