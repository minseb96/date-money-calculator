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

  res.render('index', { restMoney: Items[0].REST_MONEY });
});

router.get('/money/config/:separator', async (req, res) => {
  const isExceed = await isExceedDailyLimit();
  if(isExceed) {
    return res.status(200).json({amount: 0, message: "하루 지급 금액을 초과 하였습니다."});
  }

  const separator = req.params.separator;
  const moneyConfigurationTable = 'MONEY_CONFIGURATION';
  const params = {
    TableName: moneyConfigurationTable,
    KeyConditionExpression: "ID = :ID",
    ExpressionAttributeValues: {
      ":ID": 1
    }
  }
  const {Items} = await dynamoDB.query(params).promise();

  await putDailyRecord();
  return res.status(200).json({amount: separator === "WEEKDAY" ? Items[0].WEEKDAY_PRICE : Items[0].WEEKEND_PRICE});
});

const putDailyRecord = async () => {
  const moneyLimitScheduleTable = 'MONEY_LIMIT_SCHEDULE';
  const todayDate = new Date();
  const parsedDate = `${todayDate.getFullYear()}-${(todayDate.getMonth()+1).toString().padStart(2,0)}-${todayDate.getDate().toString().padStart(2,0)}`;
  const params = {
    TableName: moneyLimitScheduleTable,
    Item: {
      "ID": 1,
      "INSERTED_DT": parsedDate,
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

const isExceedDailyLimit = async () => {
  const tableName = 'MONEY_LIMIT_SCHEDULE';
  const todayDate = new Date();
  const parsedDate = `${todayDate.getFullYear()}-${(todayDate.getMonth()+1).toString().padStart(2,0)}-${todayDate.getDate().toString().padStart(2,0)}`;
  const params = {
    TableName: tableName,
    FilterExpression: "INSERTED_DT = :INSERTED_DT",
    ExpressionAttributeValues: {
      ":INSERTED_DT": parsedDate
    }
  };

  const { Items } = await dynamoDB.scan(params).promise();
  if (Items.length) {
    return true;
  }
  return false;
}

module.exports = router;
