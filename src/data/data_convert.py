import pandas as pd
import json

df = pd.read_excel('./src/data/norm_positive_data.xlsx')

df_filtered = df.iloc[:, :2]
df_filtered.columns = ['id', 'label']

data_list = df_filtered.to_dict(orient='records')

ts_content = f"export const normPositiveData = {json.dumps(data_list, ensure_ascii=False, indent=2)};"

with open('norm_positive_data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("File: data.ts")


'''df = pd.read_excel('./src/data/deep_positive_data.xlsx')

df_filtered = df.iloc[:, :3]
df_filtered.columns = ['id', 'label', 'demerit']

data_list = df_filtered.to_dict(orient='records')

ts_content = f"export const deepPositiveData = {json.dumps(data_list, ensure_ascii=False, indent=2)};"

with open('deep_positive_data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("File: data.ts")'''