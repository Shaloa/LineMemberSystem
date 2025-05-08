import React, { useState, useEffect } from "react";

const RegisterForm = () => {
  const [form, setForm] = useState({
    name: "",
	furigana: "",
    birth: "",
    gender: "",
    address: "",
	email: "",
    idImage: null,
    agreed: false,
	userId: "",
  });
  
  const API_BASE = process.env.REACT_APP_API_URL;
  
  const [liffInitialized, setLiffInitialized] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() =>{
	  const initLiff = async() =>{
		  try{
			  await window.liff.init({ liffId:"2007116087-jvyN7W7l"});
			  
			  //ログインしてなければリダイレクトして止める
			  if(!window.liff.isLoggedIn()){
				  window.liff.login();
				  return;
			  }
			  
			  //ログイン済ならプロフィール取得
			  const profile = await window.liff.getProfile();
			  setForm(prev => ({ ...prev, userId: profile.userId }));
			  setLoading(false);
			  
			  try {
				const res = await fetch(`${API_BASE}/api/userinfo?userId=${profile.userId}`)
				if (res.ok) {
					const result = await res.json();
					if (result.success && result.data) {
						console.log("取得したユーザーデータ:", result.data);
						
						// データがある場合はフォームにセット
						setForm(prev => ({
							...prev,
							name: result.data.name || "",
							furigana: result.data.furigana || "",
							birth: result.data.birth || "",
							gender: result.data.gender || "",
							address: result.data.address || "",
							email: result.data.email || "",
							userId: profile.userId,  // 念のためもう一度セット
							idImage: null,            // 画像はサーバーには保存してないのでnullにしておく
							agreed: true,             // すでに登録してるなら同意もしてる想定
						}));
					}
				}
			  } 
			  catch (error) {
				    console.error('ユーザー情報取得エラー', error);
			  }
			}
			  
			  catch (error){
			  console.error('LIFF初期化エラー',JSON.stringify(error, null, 2));
			  alert("LINE連携に失敗しました。再読み込みしてください。");
		  }
	  };
	  
	  initLiff();
  }, []);
  
  
  const handleChange = (e) => {
  const { name, value, type, checked, files } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
  }));
};

  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) =>{
	  e.preventDefault();
	  
 
  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('furigana', form.furigana);
  formData.append('birth', form.birth);
  formData.append('gender', form.gender);
  formData.append('address', form.address);
  formData.append('email', form.email);
  formData.append('userId', form.userId);
  formData.append('idImage', form.idImage);
  formData.append('agreed', form.agreed);

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
	  setSubmitted(true); // 登録完了フラグをtrueに！
	  
	  setTimeout(() => {
         window.location.href = 'https://lin.ee/nePaTRy';
      }, 2000); // 2秒待ってから戻る
    } else {
      alert('登録に失敗しました。');
    }
  } catch (err) {
    console.error(err);
    alert('エラーが発生しました。');
  }
};


if (loading) {
  return (
    <div className="p-4 max-w-md mx-auto space-y-4 text-center">
      <p>LINE連携中です。少々お待ちください...</p>
    </div>
  );
}

if (submitted) {
  return (
    <div className="p-4 max-w-md mx-auto space-y-4 text-center">
      <h2 className="text-xl font-bold">登録が完了しました！</h2>
      <p>自動的にLINEへ戻ります。</p>
    </div>
  );
}


  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-4 border rounded shadow">
      <h2 className="text-xl font-bold">個人情報登録フォーム</h2>

      <div>
        <label>名前</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border p-2" required />
      </div>
	  
	  <div>
		<label>フリガナ</label>
		<input
			type="text"
			name="furigana"
			value={form.furigana}
			onChange={handleChange}
			className="w-full border p-2"
			required
		/>
	  </div>

      <div>
        <label>生年月日</label>
        <input type="date" name="birth" value={form.birth} onChange={handleChange} className="w-full border p-2" required />
      </div>

      <div>
        <label>性別</label>
        <select name="gender" value={form.gender} onChange={handleChange} className="w-full border p-2" required>
          <option value="">選択してください</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div>
        <label>住所</label>
        <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border p-2" required />
      </div>
	  
	  <div>
		<label>メールアドレス</label>
		<input
			type="email"
			name="email"
			value={form.email}
			onChange={handleChange}
			className="w-full border p-2"
			required
		/>
	  </div>

      <div>
        <label>身分証の画像</label>
        <input type="file" name="idImage" onChange={handleChange} className="w-full" accept="image/*" required />
      </div>

      <div className="border p-2 text-sm bg-gray-100">
        <p>プライバシーポリシーをここに表示します。個人情報は適切に管理されます。</p>
      </div>

      <div>
        <label>
          <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} />
          同意します
        </label>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        登録する
      </button>
    </form>
  );
};

export default RegisterForm;
